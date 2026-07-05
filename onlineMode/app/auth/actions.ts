'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const roleFromForm = formData.get('role') as string

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check profile role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  let finalRole = profile?.role

  if (!finalRole && data.user.user_metadata?.role) {
    finalRole = data.user.user_metadata.role
  }

  // Last resort fallback to what was selected in the form (if confirmed authority)
  // This helps if the profile table is out of sync but the user is indeed an authority
  if (!finalRole && (roleFromForm === 'authority' || roleFromForm === 'community_supporter')) {
    finalRole = roleFromForm
  }

  if (profileError) {
    console.error('Login role check error:', profileError)
  }

  // RECOVERY LOGIC: If profile is missing but we identified a role, create it now
  // This helps if the database was reset or profile records were deleted but Auth users remain
  if (!profile && finalRole) {
    const { error: recoveryError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || 'Restored User',
      role: finalRole,
    })

    if (recoveryError) {
      console.error('Profile recovery failed:', recoveryError)
    }
  }

  // Sync role to user metadata if there's a mismatch (helps middleware)
  if (finalRole && data.user.user_metadata?.role !== finalRole) {
    await supabase.auth.updateUser({
      data: { role: finalRole }
    })
  }

  revalidatePath('/', 'layout')

  // Redirect based on role
  if (finalRole === 'authority' || finalRole === 'community_supporter') {
    redirect('/authority/dashboard')
  } else {
    redirect('/')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create profile entry
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: email,
      full_name: fullName,
      role: role,
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
