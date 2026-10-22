import Link from "next/link";

export default function Bouton({ variante = "principal", href, children, ...props }) {
  const classe = `bouton bouton--${variante}`;
  if (href) {
    return (
      <Link href={href} className={classe} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classe} {...props}>
      {children}
    </button>
  );
}
