const CATEGORIES = [
  'firsatlar',
  'yemeklik',
  'et',
  'meyve',
  'sut',
  'kahvalti',
  'atistirmalik',
  'icecek',
  'ekmek',
  'dondurulmus',
]

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }))
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
