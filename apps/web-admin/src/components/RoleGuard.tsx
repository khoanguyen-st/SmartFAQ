import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUserInfo } from '@/services/auth.services'

interface RoleGuardProps {
  allowedRoles: string[]
  children?: React.ReactNode
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const user = await getCurrentUserInfo()

        // Chuyển role về chữ thường để so sánh an toàn
        const userRole = user.role.trim().toLowerCase()
        const hasPermission = allowedRoles.some(r => r.toLowerCase() === userRole)

        setIsAuthorized(hasPermission)
      } catch {
        // SỬA LỖI Ở ĐÂY: Bỏ "(error)" đi vì không dùng đến biến error
        // Nếu lỗi (ví dụ chưa login), coi như không có quyền
        setIsAuthorized(false)
      }
    }

    checkPermission()
  }, [allowedRoles])

  // 1. Đang kiểm tra -> Hiện Loading
  if (isAuthorized === null) {
    return <div className="flex h-screen items-center justify-center">Checking permissions...</div>
  }

  // 2. Không có quyền -> Đá về Dashboard
  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />
  }

  // 3. Có quyền -> Cho phép vào trang
  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
