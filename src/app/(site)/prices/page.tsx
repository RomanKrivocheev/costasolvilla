'use client';

import { useLanguage } from '@/providers/language-provider';

const PricesPage = () => {
  const { t } = useLanguage();

  const days = [
    { day: t.pricingMonday, price: t.pricingMondayPrice },
    { day: t.pricingTuesday, price: t.pricingTuesdayPrice },
    { day: t.pricingWednesday, price: t.pricingWednesdayPrice },
    { day: t.pricingThursday, price: t.pricingThursdayPrice },
    { day: t.pricingFriday, price: t.pricingFridayPrice },
    { day: t.pricingSaturday, price: t.pricingSaturdayPrice },
    { day: t.pricingSunday, price: t.pricingSundayPrice },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 py-8">
      <h1 className="text-4xl md:text-5xl font-semibold text-center text-foreground">
        {t.pricingTitle}
      </h1>

      <div className="mt-8 overflow-hidden rounded-xl border border-foreground/10 bg-background">
        <table className="w-full text-left text-sm">
          <thead className="bg-foreground/5 text-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t.pricingDayLabel}</th>
              <th className="px-4 py-3 font-semibold text-right">
                {t.pricingPriceLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((item, index) => (
              <tr
                key={item.day}
                className={`transition-colors hover:bg-foreground/5 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-foreground/2'
                }`}
              >
                <td className="px-4 py-4 font-medium text-foreground">
                  {item.day}
                </td>
                <td className="px-4 py-4 text-right text-lg font-semibold text-primary">
                  {item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PricesPage;
