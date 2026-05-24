import useParticles from '../hooks/useParticles';

export default function Particles({ connectLines = false, count = 50 }) {
  const ref = useParticles({ connectLines, count, lineDistance: 110 });
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: connectLines ? 0.55 : 0.5 }}
    />
  );
}
