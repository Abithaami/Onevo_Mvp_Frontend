export default function SelectionChip({ active, onClick, children }) {
  return (
    <button type="button" className={`selection-chip ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
