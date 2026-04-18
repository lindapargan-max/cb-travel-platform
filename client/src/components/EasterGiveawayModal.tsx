import { useState, useEffect } from "react";

const FACEBOOK_URL = "https://www.facebook.com/cbtraveluk/";
const GIVEAWAY_END = "16th April 2026";

export default function EasterGiveawayModal() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("easter_giveaway_dismissed");
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("easter_giveaway_dismissed", "1");
    }, 400);
  };

  if (!visible) return null;

  return (
    <div className={`easter-overlay ${closing ? "easter-overlay--out" : ""}`} onClick={close}>
      <div
        className={`easter-modal ${closing ? "easter-modal--out" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button className="easter-close" onClick={close} aria-label="Close">
          ✕
        </button>

        {/* Egg decorations */}
        <span className="easter-egg easter-egg--tl">🥚</span>
        <span className="easter-egg easter-egg--tr">🥚</span>
        <span className="easter-egg easter-egg--bl">🐣</span>
        <span className="easter-egg easter-egg--br">🌷</span>

        {/* Header */}
        <div className="easter-header">
          <div className="easter-chicks">🐣 ✨ 🐣</div>
          <h2 className="easter-title">HUGE Easter Giveaway</h2>
          <p className="easter-subtitle">In partnership with</p>
          <div className="easter-partners">
            <span className="easter-partner-badge">CB Travel</span>
            <span className="easter-x">×</span>
            <span className="easter-partner-badge easter-partner-badge--gold">Pandoro 🇮🇹</span>
          </div>
          <p className="easter-sub2">Pandoro Italian Restaurant, Waterloo</p>
        </div>

        {/* Prizes */}
        <div className="easter-prizes">
          {/* Prize 1 */}
          <div className="easter-prize">
            <div className="easter-prize-num">🎁 Prize 1</div>
            <div className="easter-prize-title">Pandoro Dining Experience</div>
            <ul className="easter-prize-list">
              <li>🍽️ Table for <strong>8 people</strong></li>
              <li>🍝 <strong>8 Main Courses</strong></li>
              <li>🍷 A bottle of wine <em>or</em> 8 soft drinks</li>
            </ul>
          </div>

          {/* Prize 2 */}
          <div className="easter-prize easter-prize--gold">
            <div className="easter-prize-num">✈️ Prize 2</div>
            <div className="easter-prize-title">CB Travel Getaway</div>
            <ul className="easter-prize-list">
              <li>💷 <strong>£200 Holiday Voucher</strong></li>
              <li>🛫 Complimentary <strong>Airport Lounge Pass</strong> for 2</li>
            </ul>
          </div>
        </div>

        {/* How to enter */}
        <div className="easter-enter">
          <div className="easter-enter-title">🔥 How to Enter</div>
          <div className="easter-enter-steps">
            <span>✔️ Follow <strong>CB Travel</strong> &amp; <strong>Pandoro</strong></span>
            <span>👍 Like this post</span>
            <span>🔁 Share this post</span>
            <span>👥 Tag <strong>3 friends</strong></span>
          </div>
        </div>

        {/* Charity */}
        <div className="easter-charity">
          <span className="easter-heart">💙</span>
          <span>Every share = <strong>40p donated</strong> to <strong>Fylde Kids Foundation</strong> — share &amp; help local children!</span>
        </div>

        {/* CTA */}
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="easter-cta"
          onClick={close}
        >
          Enter the Giveaway on Facebook →
        </a>

        <p className="easter-ends">⏳ Giveaway ends {GIVEAWAY_END}</p>
      </div>
    </div>
  );
}
