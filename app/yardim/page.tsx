'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

export default function YardimMerkezi() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: 'Sipariş nasıl veririm?',
      answer: 'Ana sayfadan adresinizi seçin, ardından YEMEK veya MARKET bölümünden istediğiniz ürünleri sepete ekleyin. Sepeti onaylayarak siparişinizi tamamlayabilirsiniz.'
    },
    {
      question: 'Teslimat süresi ne kadar?',
      answer: 'Samsun 19 Mayıs bölgesinde ortalama teslimat süremiz 20-30 dakikadır. Yoğun saatlerde bu süre 45 dakikaya kadar çıkabilir.'
    },
    {
      question: 'Ödeme yöntemleri nelerdir?',
      answer: 'Nakit, kredi kartı ve IBAN ile ödeme yapabilirsiniz. Tüm ödeme yöntemleri güvenlidir.'
    },
    {
      question: 'Siparişimi iptal edebilir miyim?',
      answer: 'Sipariş hazırlanmaya başlamadan önce iptal edebilirsiniz. Hazırlık başladıktan sonra iptal işlemi için müşteri hizmetleriyle iletişime geçmeniz gerekmektedir.'
    },
    {
      question: 'Minimum sipariş tutarı var mı?',
      answer: 'Hayır, minimum sipariş tutarı bulunmamaktadır. İstediğiniz tutarda sipariş verebilirsiniz.'
    },
    {
      question: 'Kuryeyi nasıl takip edebilirim?',
      answer: 'Sipariş detaylarından kuryenizin konumunu canlı olarak takip edebilirsiniz.'
    },
    {
      question: 'Adresimi nasıl değiştirebilirim?',
      answer: 'Ana sayfadaki adres butonuna tıklayarak yeni adres ekleyebilir veya mevcut adresinizi düzenleyebilirsiniz.'
    },
    {
      question: 'İletişim bilgileriniz nedir?',
      answer: 'Telefon: 0XXX XXX XX XX | E-posta: destek@aldagel.com | Çalışma Saatleri: 09:00 - 23:00'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-[64px] flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Yardım Merkezi</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Size Nasıl Yardımcı Olabiliriz?</h2>
          <p className="text-orange-100">
            Sık sorulan sorular ve destek bilgileri
          </p>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sık Sorulan Sorular</h3>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp size={20} className="text-orange-500 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hala Yardıma İhtiyacınız Var mı?</h3>
          <p className="text-gray-600 mb-4">
            Sorununuz çözülmediyse bizimle iletişime geçebilirsiniz.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="tel:0XXXXXXXXXX"
              className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                📞
              </div>
              <div>
                <p className="font-semibold text-gray-900">Telefon</p>
                <p className="text-sm text-gray-600">0XXX XXX XX XX</p>
              </div>
            </a>
            <a
              href="mailto:destek@aldagel.com"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                ✉️
              </div>
              <div>
                <p className="font-semibold text-gray-900">E-posta</p>
                <p className="text-sm text-gray-600">destek@aldagel.com</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

