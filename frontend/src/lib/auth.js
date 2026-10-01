export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('dailygram_user') || 'null')
  } catch {
    return null
  }
}

export const getToken = () => localStorage.getItem('dailygram_token')
export const getRefreshToken = () => localStorage.getItem('dailygram_refresh_token')

export const saveSession = (data = {}) => {
  if (data.accessToken) {
    localStorage.setItem('dailygram_token', data.accessToken)
  }

  if (data.refreshToken) {
    localStorage.setItem('dailygram_refresh_token', data.refreshToken)
  }

  const current = getUser() || {}

  const user = {
    ...current,
    ...(data.userid !== undefined ? { userid: data.userid } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.role !== undefined ? { role: data.role } : {}),
    ...(data.skills !== undefined ? { skills: data.skills || [] } : {}),
    ...(data.mentorApproved !== undefined ? { mentorApproved: data.mentorApproved } : {}),
    ...(data.premiumEligible !== undefined ? { premiumEligible: data.premiumEligible } : {}),
    ...(data.premiumEnabled !== undefined ? { premiumEnabled: data.premiumEnabled } : {}),
    ...(data.mentorshipPrice !== undefined ? { mentorshipPrice: data.mentorshipPrice } : {})
  }

  localStorage.setItem('dailygram_user', JSON.stringify(user))
  return user
}

export const updateUser = (data = {}) => {
  const currentUser = getUser() || {}
  const updatedUser = { ...currentUser, ...data }
  localStorage.setItem('dailygram_user', JSON.stringify(updatedUser))
  return updatedUser
}

export const clearSession = () => {
  localStorage.removeItem('dailygram_token')
  localStorage.removeItem('dailygram_refresh_token')
  localStorage.removeItem('dailygram_user')
}

export const isLoggedIn = () => Boolean(getToken())
