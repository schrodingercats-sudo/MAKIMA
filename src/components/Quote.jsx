import React from 'react';
import './Quote.css';

export const Quote = React.memo(function Quote() {
  return (
    <div className="quotes-card-item">
      <div className="quotes-card-text">
        <span className="quotes-section-tag">06 QUOTES</span>
        <h3 className="quotes-big-quote">
          “ There are <br />
          necessary <span className="text-rust-italic">evils.”</span>
        </h3>
        <span className="quotes-author">— MAKIMA</span>
      </div>

      <div className="quotes-card-image">
        <img
          src="/images/quote-bg.webp"
          alt="Makima Quote"
          className="quotes-img"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
});

export default Quote;
