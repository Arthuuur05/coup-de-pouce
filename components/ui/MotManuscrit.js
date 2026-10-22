// Un seul par écran maximum (voir DESIGN_SYSTEM.md).
export default function MotManuscrit({ children, style }) {
  return (
    <span className="manuscrit" style={style} aria-hidden="true">
      {children}
    </span>
  );
}
