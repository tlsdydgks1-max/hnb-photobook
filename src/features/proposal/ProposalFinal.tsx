type ProposalFinalProps = {
  onReplay: () => void;
  onGallery: () => void;
};

export function ProposalFinal({ onReplay, onGallery }: ProposalFinalProps) {
  return (
    <section className="screen proposal-screen">
      <div className="proposal-card glass-panel">
        <p className="eyebrow">The Next Chapter</p>
        <h1>우리가 고른 장면 다음에도 함께할래?</h1>
        <p>
          하트로 남긴 사진들처럼, 앞으로의 시간도 우리가 직접 고르고 아끼는
          이야기로 채워가고 싶어.
        </p>
        <div className="proposal-ring" aria-hidden="true">
          <span />
        </div>
      </div>
      <div className="intro-actions">
        <button className="primary-button" onClick={onGallery}>
          사진 다시 고르기
        </button>
        <button className="secondary-button" onClick={onReplay}>
          스토리 다시 보기
        </button>
      </div>
    </section>
  );
}
