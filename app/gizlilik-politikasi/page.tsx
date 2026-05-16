'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GizlilikPolitikasi() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#f7f7f7] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={22} className="text-[#3c4043]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-[#3c4043]">
            Gizlilik Politikası
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="bg-white rounded-xl p-4 sm:p-8 border border-[#e8e8e8] space-y-6 text-[#3c4043] text-[14px] sm:text-[15px] leading-relaxed">
          
          <div className="text-center mb-8">
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#f59e0b] mb-2">Alda Gel</h2>
            <p className="text-[#6f6f6f] text-[13px]">Son güncelleme: 17 Mayıs 2026</p>
          </div>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">1. Giriş</h3>
            <p>
              Alda Gel (&quot;Uygulama&quot;), Mergen Teknoloji (&quot;Şirket&quot;, &quot;biz&quot;) tarafından işletilmektedir. 
              Bu gizlilik politikası, uygulamamızı kullanırken kişisel verilerinizin nasıl toplandığını, 
              kullanıldığını, saklandığını ve korunduğunu açıklamaktadır. 
              Uygulamamızı kullanarak bu politikayı kabul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">2. Toplanan Veriler</h3>
            <p className="mb-2">Hizmetlerimizi sunabilmek için aşağıdaki bilgileri topluyoruz:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, telefon numarası</li>
              <li><strong>İletişim Bilgileri:</strong> Teslimat adresi</li>
              <li><strong>Sipariş Bilgileri:</strong> Sipariş geçmişi, ödeme yöntemi tercihi, sipariş notları</li>
              <li><strong>Konum Bilgileri:</strong> Teslimat adresini belirlemek için konum verisi (yalnızca izin verildiğinde)</li>
              <li><strong>Cihaz Bilgileri:</strong> Cihaz türü, işletim sistemi, uygulama sürümü</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">3. Verilerin Kullanım Amacı</h3>
            <p className="mb-2">Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Sipariş oluşturma, işleme ve teslimat süreçlerinin yönetimi</li>
              <li>Kullanıcı hesabının oluşturulması ve yönetimi</li>
              <li>Sipariş durumu hakkında bildirim gönderilmesi</li>
              <li>Müşteri destek hizmetlerinin sağlanması</li>
              <li>Hizmet kalitesinin iyileştirilmesi ve kullanıcı deneyiminin geliştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">4. Verilerin Saklanması ve Güvenliği</h3>
            <p>
              Kişisel verileriniz, Supabase altyapısı üzerinde endüstri standardı güvenlik önlemleriyle 
              korunmaktadır. Verileriniz şifreli bağlantılar (SSL/TLS) aracılığıyla iletilir ve 
              yetkisiz erişime karşı korunur. Verileriniz yalnızca hizmetin sunulması için gerekli 
              süre boyunca saklanır.
            </p>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">5. Verilerin Paylaşımı</h3>
            <p className="mb-2">Kişisel verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Restoran İş Ortakları:</strong> Siparişinizin hazırlanması için gerekli bilgiler ilgili restoranla paylaşılır</li>
              <li><strong>Kurye Hizmeti:</strong> Teslimat adresiniz ve iletişim bilgileriniz kurye ile paylaşılır</li>
              <li><strong>Yasal Zorunluluk:</strong> Yasal düzenlemeler veya mahkeme kararı gereği bilgi paylaşımı yapılabilir</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">6. Konum Verileri</h3>
            <p>
              Uygulamamız, teslimat adresinizi doğru belirleyebilmek için cihazınızın konum hizmetlerini 
              kullanabilir. Konum verisi yalnızca siz izin verdiğinizde toplanır ve yalnızca adres 
              belirleme amacıyla kullanılır. Konum izninizi cihaz ayarlarından istediğiniz zaman 
              kapatabilirsiniz.
            </p>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">7. Bildirimler</h3>
            <p>
              Sipariş durumu güncellemeleri için push bildirimleri gönderebiliriz. 
              Bildirim tercihlerinizi cihaz ayarlarından yönetebilirsiniz.
            </p>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">8. Kullanıcı Hakları</h3>
            <p className="mb-2">6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
              <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">9. Çocukların Gizliliği</h3>
            <p>
              Uygulamamız 18 yaşından küçük bireylere yönelik değildir. Bilerek 18 yaşından küçük 
              bireylerden kişisel veri toplamayız. Eğer 18 yaşından küçük bir bireyin veri paylaştığını 
              fark edersek, bu verileri derhal sileriz.
            </p>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">10. Politika Değişiklikleri</h3>
            <p>
              Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler yapıldığında 
              uygulama içi bildirim ile bilgilendirileceksiniz. Güncel politikayı düzenli olarak 
              kontrol etmenizi öneririz.
            </p>
          </section>

          <section>
            <h3 className="text-[16px] sm:text-[18px] font-bold mb-3">11. İletişim</h3>
            <p className="mb-2">
              Gizlilik politikamız hakkında sorularınız veya talepleriniz için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="bg-[#f7f7f7] rounded-lg p-4 space-y-1.5">
              <p><strong>Şirket:</strong> Mergen Teknoloji</p>
              <p><strong>Konum:</strong> Samsun, 19 Mayıs</p>
              <p><strong>Uygulama:</strong> Alda Gel - Müşteri</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
