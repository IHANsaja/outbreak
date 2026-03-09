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
    console.log('Profile missing or role empty, using metadata role:', finalRole)
  }

  // Last resort fallback to what was selected in the form (if confirmed authority)
  // This helps if the profile table is out of sync but the user is indeed an authority
  if (!finalRole && (roleFromForm === 'authority' || roleFromForm === 'community_supporter')) {
    finalRole = roleFromForm
    console.log('Falling back to form role choice:', finalRole)
  }

  if (profileError) {
    console.error('Login role check error:', profileError)
  }

  // RECOVERY LOGIC: If profile is missing but we identified a role, create it now
  // This helps if the database was reset or profile records were deleted but Auth users remain
  if (!profile && finalRole) {
    console.log('Profile record missing for UID:', data.user.id, 'Creating recovery record with role:', finalRole)
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

  console.log('Login diagnostic:', {
    email,
    uid: data.user.id,
    profileRole: profile?.role,
    metadataRole: data.user.user_metadata?.role,
    finalRole: finalRole
  })

  // Sync role to user metadata if there's a mismatch (helps middleware)
  if (finalRole && data.user.user_metadata?.role !== finalRole) {
    await supabase.auth.updateUser({
      data: { role: finalRole }
    })
  }

  revalidatePath('/', 'layout')
  
  // Redirect based on role
  if (finalRole === 'authority' || finalRole === 'community_supporter') {
    console.log('Redirecting to authority dashboard for role:', finalRole)
    redirect('/authority/dashboard')
  } else {
    console.log('Redirecting to citizen home for role:', finalRole)
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
