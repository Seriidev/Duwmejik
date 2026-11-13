export function Upcoming({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#5b6472]">Этот раздел следующий. Справочник материалов уже открыт в тарифах и ценах.</p>
    </div>
  )
}
