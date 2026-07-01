'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { fetchUserAddressFullText } from '@/app/lib/addressService'

interface AuthModalProps {
  onClose: () => void
  onLoginSuccess: (name: string) => void
}

export default function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      })

      if (authError) throw authError

      const { data: customerRows, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', loginEmail.trim())
        .order('created_at', { ascending: false })

      if (customerError) throw customerError

      // app_user kaydını tercih et, yoksa en yeni kaydı al
      const customerData = customerRows?.find(r => r.registration_source === 'app_user') ?? customerRows?.[0]
      if (!customerData) throw new Error('Müşteri kaydı bulunamadı')

      localStorage.setItem('customer_id', customerData.id)
      localStorage.setItem('customer_name', customerData.full_name)
      if (customerData.phone) {
        localStorage.setItem('customer_phone', customerData.phone)
      }

      const savedAddress = authData.user
        ? await fetchUserAddressFullText(authData.user.id)
        : null
      if (savedAddress) {
        localStorage.setItem('customer_address', savedAddress)
      }

      onLoginSuccess(customerData.full_name)
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail.trim(),
        password: registerPassword,
        options: {
          data: { full_name: fullName }
        }
      })

      if (authError) throw authError

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: firstName.trim(),
          surname: lastName.trim(),
          full_name: fullName,
          email: registerEmail.trim(),
          phone: registerPhone.trim(),
          registration_source: 'app_user'
        }])
        .select()
        .single()

      if (customerError) throw customerError

      localStorage.setItem('customer_id', customerData.id)
      localStorage.setItem('customer_name', fullName)

      onLoginSuccess(fullName)
    } catch (err: any) {
      setError(err.message || 'Kayıt oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-[480px] max-h-[95dvh] sm:max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e8e8e8]">
          <h2 className="text-[18px] sm:text-[20px] font-bold text-[#3c4043]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6f6f6f] hover:text-[#3c4043] text-[28px] leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  placeholder="Şifreniz"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-red-500 text-[12px]">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-[#f59e0b] text-white rounded-lg font-semibold text-[14px] hover:bg-[#d97706] transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>

              <p className="text-[13px] text-center text-[#6f6f6f]">
                Henüz Alda Gel&apos;e kayıtlı değil misin?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError('') }}
                  className="text-[#f59e0b] font-semibold hover:underline"
                >
                  Kayıt Ol
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  placeholder="Örn: Yılmaz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#3c4043] mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  placeholder="En az 6 karakter"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full h-[48px] px-4 bg-white border border-[#e8e8e8] rounded-lg text-[14px] focus:outline-none focus:border-[#f59e0b] transition-colors"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-red-500 text-[12px]">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-[#f59e0b] text-white rounded-lg font-semibold text-[14px] hover:bg-[#d97706] transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
              >
                {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
              </button>

              <p className="text-[13px] text-center text-[#6f6f6f]">
                Zaten hesabın var mı?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError('') }}
                  className="text-[#f59e0b] font-semibold hover:underline"
                >
                  Giriş Yap
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
