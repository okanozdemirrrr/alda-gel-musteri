'use client'

import { useState } from 'react'
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

export default function HesapSil() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone || phone.length < 10) {
      setError('Geçerli bir telefon numarası giriniz.')
      return
    }
    setStep('confirm')
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    try {
      const cleanPhone = phone.replace(/\s/g, '')

      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .single()

      if (fetchError || !customer) {
        setError('Bu telefon numarasına ait hesap bulunamadı.')
        setStep('form')
        setLoading(false)
        return
      }

      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)

      if (deleteError) throw deleteError

      setStep('done')
    } catch (err: any) {
      setError('Hesap silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-page bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10">
        <div className="app-content-narrow px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#f7f7f7] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={22} className="text-[#3c4043]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-[#3c4043]">
            Hesap Silme
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="app-content-narrow px-3 sm:px-6 py-6 sm:py-10">

        {/* Done State */}
        {step === 'done' && (
          <div className="bg-white rounded-xl p-6 sm:p-10 border border-[#e8e8e8] text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-[20px] font-bold text-[#3c4043] mb-2">Hesabınız Silindi</h2>
            <p className="text-[#6f6f6f] text-[14px] mb-6">
              Hesabınız ve tüm kişisel verileriniz başarıyla silindi. Bizi tercih ettiğiniz için teşekkür ederiz.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#f59e0b] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#d97706] transition-colors min-h-[48px]"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        )}

        {/* Form State */}
        {step === 'form' && (
          <div className="bg-white rounded-xl p-4 sm:p-8 border border-[#e8e8e8]">
            <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
              <p className="text-[13px] sm:text-[14px] text-red-700">
                <strong>Dikkat:</strong> Hesabınızı sildiğinizde tüm kişisel verileriniz, sipariş geçmişiniz ve 
                hesap bilgileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
              </p>
            </div>

            <h2 className="text-[16px] sm:text-[18px] font-bold text-[#3c4043] mb-1">Hesap Silme Talebi</h2>
            <p className="text-[#6f6f6f] text-[13px] sm:text-[14px] mb-6">
              Hesabınızı silmek için kayıtlı telefon numaranızı girin.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-[13px] sm:text-[14px] p-3 rounded-lg mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-1.5">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full border border-[#e8e8e8] rounded-lg px-4 py-3 text-[14px] sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] min-h-[48px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-1.5">
                  Silme Sebebi <span className="font-normal text-[#6f6f6f]">(Opsiyonel)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Hesabınızı neden silmek istiyorsunuz?"
                  rows={3}
                  className="w-full border border-[#e8e8e8] rounded-lg px-4 py-3 text-[14px] sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors min-h-[48px] flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Hesabımı Sil
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#e8e8e8]">
              <h3 className="text-[14px] font-semibold text-[#3c4043] mb-2">Silinecek veriler:</h3>
              <ul className="text-[13px] text-[#6f6f6f] space-y-1.5">
                <li>• Kişisel bilgileriniz (ad, soyad, telefon)</li>
                <li>• Kayıtlı adresleriniz</li>
                <li>• Sipariş geçmişiniz</li>
                <li>• Değerlendirmeleriniz</li>
                <li>• Hesap ayarlarınız</li>
              </ul>
            </div>
          </div>
        )}

        {/* Confirm State */}
        {step === 'confirm' && (
          <div className="bg-white rounded-xl p-4 sm:p-8 border border-[#e8e8e8] text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-[20px] font-bold text-[#3c4043] mb-2">Emin misiniz?</h2>
            <p className="text-[#6f6f6f] text-[14px] mb-6">
              <strong>{phone}</strong> numarasına ait hesap kalıcı olarak silinecektir. 
              Bu işlem geri alınamaz.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-[13px] sm:text-[14px] p-3 rounded-lg mb-4 border border-red-100">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setStep('form')}
                disabled={loading}
                className="flex-1 bg-[#f7f7f7] text-[#3c4043] font-semibold py-3 rounded-lg hover:bg-[#e8e8e8] transition-colors min-h-[48px]"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors min-h-[48px] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Evet, Hesabımı Sil
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
