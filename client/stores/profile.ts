import { defineStore } from 'pinia'
import type { UpdateProfileData } from '~/types/auth'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    isLoading: false,
    error: '',
    successMessage: '',
    formErrors: {} as Record<string, string>
  }),

  actions: {
    async updateProfile(updateData: UpdateProfileData) {
      this.isLoading = true
      this.error = ''
      this.successMessage = ''
      this.formErrors = {}

      try {
        const { updateProfile } = useAuth()
        
        // Ensure required fields are present
        const profileUpdate = {
          name: updateData.name || '',
          email: updateData.email || '',
          ...(updateData.currentPassword && {
            currentPassword: updateData.currentPassword
          }),
          ...(updateData.newPassword && {
            newPassword: updateData.newPassword
          })
        }

        await updateProfile(profileUpdate)
        this.successMessage = 'Profile updated successfully'
      } catch (error: any) {
        this.error = error.message || 'An error occurred while updating your profile'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    validateForm(form: {
      name: string
      email: string
      currentPassword?: string
      newPassword?: string | null
    }) {
      this.formErrors = {}
      let isValid = true

      if (!form.name.trim()) {
        this.formErrors.name = 'Name is required'
        isValid = false
      }

      if (!form.email) {
        this.formErrors.email = 'Email is required'
        isValid = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        this.formErrors.email = 'Please enter a valid email address'
        isValid = false
      }

      if (form.newPassword) {
        if (!form.currentPassword) {
          this.formErrors.currentPassword = 'Current password is required to set a new password'
          isValid = false
        }

        if (form.newPassword.length < 6) {
          this.formErrors.newPassword = 'New password must be at least 6 characters'
          isValid = false
        }
      }

      return isValid
    },

    resetMessages() {
      this.error = ''
      this.successMessage = ''
    }
  }
})
