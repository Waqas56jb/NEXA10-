export default function BgGrid({ orbs = false }) {
  return (
    <>
      {orbs && <div className="bg-orbs" aria-hidden="true" />}
      <div className="bg-grid" aria-hidden="true" />
    </>
  );
}
