import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CreateUserDialogProps, CreateUserDialogPayload } from '@/interfaces/create-user-dialog'

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose, onSubmit, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateUserDialogPayload>({
    username: '',
    email: '',
    password: '',
    role: '',
    campus: '',

  });
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSubmitDisabled = useMemo(() => {
    return (
      !formData.email ||
      !formData.username ||
      !formData.password ||
      formData.password.length < 8 ||
      !formData.role ||
      !formData.campus
    );
  }, [formData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null);
    try {
      await onSubmit?.(formData);
      onSuccess?.();
      onClose();
      setFormData({
        username: '',
        email: '',
        password: '',
        role: '',
        campus: '',

      });
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('user.error.createFailed'));
      console.error('Failed to create user:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:px-4">
      <div className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t('user.dialog.createTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('user.dialog.createDescription')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username *</label>
            <input
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Username"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu *</label>
            <input
              required
              type="password"
              value={formData.password}
              minLength={8}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Vai trò *</label>
            <input
              required
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              placeholder="admin, staff..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Campus *</label>
            <select
              required
              value={formData.campus}
              onChange={e => setFormData({ ...formData, campus: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                Chọn campus
              </option>
              <option value="HANOI">Hà Nội</option>
              <option value="HCM">Hồ Chí Minh</option>
              <option value="DANANG">Đà Nẵng</option>
              <option value="CANTHO">Cần Thơ</option>
            </select>
          </div>


          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitDisabled}
              className="rounded-full bg-blue-800 px-8 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUserDialog
