import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config';

/*
 * Lazy 48h rating survey.
 * Checks for pending surveys on mount (call from Dashboard or App root).
 * Shows one survey at a time, never more - buyer should never feel spammed.
 * Flow: Did you visit? → What did you pick? (multi-select) → Rate the OPG → Rate each picked product → Done
 */

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="d-flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="btn btn-sm p-0"
          style={{ fontSize: '1.6rem', lineHeight: 1, color: n <= (hover || value) ? '#e6a817' : '#ccc' }}
        >
          ★
        </button>
      ))}
      {(hover || value) > 0 && (
        <span className="text-muted small align-self-center ms-1">{STAR_LABELS[hover || value]}</span>
      )}
    </div>
  );
}

function RatingSurveyModal() {
  const [survey, setSurvey] = useState(null);         // the pending survey object
  const [step, setStep] = useState('visited');         // visited | products | opg_score | product_scores | done
  const [pickedItems, setPickedItems] = useState([]);  // selected catalog_item ids
  const [opgScore, setOpgScore] = useState(0);
  const [opgComment, setOpgComment] = useState('');
  const [productScores, setProductScores] = useState({}); // {catalog_item_id: score}
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('access_token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/ratings/pending-surveys/`, authHeader)
      .then(res => { if (res.data.length > 0) setSurvey(res.data[0]); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = async () => {
    try {
      await axios.post(`${API}/ratings/dismiss-survey/`, {
        type: survey.type,
        interest_id: survey.interest_id,
      }, authHeader);
    } catch (err) { /* non-critical */ }
    setSurvey(null);
  };

  const handleDidNotVisit = () => dismiss();

  const handleProducts = () => {
    if (pickedItems.length === 0) {
      setStep('opg_score');
    } else {
      setStep('opg_score');
    }
  };

  const toggleItem = (id) => {
    setPickedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const submitRatings = async () => {
    if (opgScore === 0) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/ratings/opg/`, {
        opg: survey.opg_id, score: opgScore, comment: opgComment,
      }, authHeader);
      for (const itemId of pickedItems) {
        const score = productScores[itemId];
        if (score) {
          await axios.post(`${API}/ratings/product/`, {
            opg: survey.opg_id, catalog_item: itemId, score,
          }, authHeader);
        }
      }
      await dismiss();
      setStep('done');
    } catch (err) {
      console.log('Rating error', err.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  if (!survey) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div className="card shadow-lg border-0" style={{ maxWidth: 480, width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-body p-4">
          <h5 style={{ color: '#2d6a4f' }}>Rate {survey.opg_name}</h5>
          <p className="text-muted small mb-3">
            You expressed interest in <strong>{survey.channel_name}</strong>.
          </p>

          {step === 'visited' && (
            <>
              <p>Did you visit or receive from <strong>{survey.opg_name}</strong>?</p>
              <div className="d-flex gap-2">
                <button
                  onClick={() => setStep('products')}
                  className="btn text-white"
                  style={{ background: '#2d6a4f' }}
                >
                  Yes, I did 👍
                </button>
                <button onClick={handleDidNotVisit} className="btn btn-outline-secondary">
                  No, not yet
                </button>
              </div>
            </>
          )}

          {step === 'products' && (
            <>
              <p className="mb-2">What did you pick or receive? <span className="text-muted small">(select all that apply)</span></p>
              {survey.products.length === 0 ? (
                <p className="text-muted small">No products found for this OPG.</p>
              ) : (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {survey.products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleItem(p.id)}
                      className={`btn btn-sm ${pickedItems.includes(p.id) ? 'text-white' : 'btn-outline-secondary'}`}
                      style={pickedItems.includes(p.id) ? { background: '#2d6a4f' } : {}}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="d-flex gap-2">
                <button onClick={handleProducts} className="btn text-white" style={{ background: '#2d6a4f' }}>
                  Next →
                </button>
                <button onClick={dismiss} className="btn btn-outline-secondary btn-sm">
                  Skip
                </button>
              </div>
            </>
          )}

          {step === 'opg_score' && (
            <>
              <p className="mb-2">How would you rate <strong>{survey.opg_name}</strong> overall?</p>
              <Stars value={opgScore} onChange={setOpgScore} />
              <textarea
                className="form-control mt-3"
                rows={2}
                placeholder="Optional comment…"
                value={opgComment}
                onChange={e => setOpgComment(e.target.value)}
              />
              <div className="d-flex gap-2 mt-3">
                {pickedItems.length > 0 ? (
                  <button
                    onClick={() => opgScore > 0 && setStep('product_scores')}
                    disabled={opgScore === 0}
                    className="btn text-white"
                    style={{ background: '#2d6a4f' }}
                  >
                    Next → Rate products
                  </button>
                ) : (
                  <button
                    onClick={submitRatings}
                    disabled={opgScore === 0 || submitting}
                    className="btn text-white"
                    style={{ background: '#2d6a4f' }}
                  >
                    {submitting ? 'Saving…' : 'Submit rating'}
                  </button>
                )}
                <button onClick={dismiss} className="btn btn-outline-secondary btn-sm">Skip</button>
              </div>
            </>
          )}

          {step === 'product_scores' && (
            <>
              <p className="mb-3">Rate the specific products you picked:</p>
              {pickedItems.map(itemId => {
                const product = survey.products.find(p => p.id === itemId);
                if (!product) return null;
                return (
                  <div key={itemId} className="mb-3">
                    <div className="fw-semibold mb-1">{product.name}</div>
                    <Stars
                      value={productScores[itemId] || 0}
                      onChange={score => setProductScores(prev => ({ ...prev, [itemId]: score }))}
                    />
                  </div>
                );
              })}
              <div className="d-flex gap-2 mt-3">
                <button
                  onClick={submitRatings}
                  disabled={submitting}
                  className="btn text-white"
                  style={{ background: '#2d6a4f' }}
                >
                  {submitting ? 'Saving…' : 'Submit ratings'}
                </button>
                <button onClick={dismiss} className="btn btn-outline-secondary btn-sm">Skip</button>
              </div>
            </>
          )}

          {step === 'done' && (
            <p className="text-success mb-0">✅ Thank you for rating {survey.opg_name}!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RatingSurveyModal;
