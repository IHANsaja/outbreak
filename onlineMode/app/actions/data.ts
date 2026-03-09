'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// FETCHING LOGIC

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
}

export async function getActiveHazards() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hazards')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hazards:', error)
    return []
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('last_location_lat, last_location_lng').eq('id', user.id).single()
    if (profile?.last_location_lat && profile?.last_location_lng) {
      return data.map((item: any) => ({
        ...item,
        distance_km: calculateDistance(profile.last_location_lat, profile.last_location_lng, item.latitude, item.longitude)
      }))
    }
  }

  return data
}

export async function getAllHazards() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hazards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('last_location_lat, last_location_lng').eq('id', user.id).single()
    if (profile?.last_location_lat && profile?.last_location_lng) {
      return data.map((item: any) => ({
        ...item,
        distance_km: calculateDistance(profile.last_location_lat, profile.last_location_lng, item.latitude, item.longitude)
      }))
    }
  }

  return data
}

export async function getOfficialUpdates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('official_updates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching updates:', error)
    return []
  }
  return data
}

export async function getStats() {
  const supabase = await createClient()
  
  const [incidents, resources, hazards, sos] = await Promise.all([
    supabase.from('incidents').select('id', { count: 'exact', head: true }).in('status', ['pending', 'verified']),
    supabase.from('resources').select('id', { count: 'exact', head: true }).in('status', ['critical', 'low']),
    supabase.from('hazards').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sos_requests').select('id', { count: 'exact', head: true }).eq('status', 'active')
  ])

  return {
    activeIncidents: incidents.count || 0,
    criticalNeeds: resources.count || 0,
    activeHazards: hazards.count || 0,
    activeSos: sos.count || 0
  }
}

export async function getRegions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('impact_percentage', { ascending: false })

  if (error) {
    console.error('Error fetching regions:', error)
    return []
  }
  return data
}

export async function getRecentSos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sos_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching SOS:', error)
    return []
  }
  return data
}

export async function getAllIncidents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('last_location_lat, last_location_lng').eq('id', user.id).single()
    if (profile?.last_location_lat && profile?.last_location_lng) {
      return data.map((item: any) => ({
        ...item,
        distance_km: item.latitude && item.longitude ? calculateDistance(profile.last_location_lat, profile.last_location_lng, item.latitude, item.longitude) : null
      }))
    }
  }

  return data
}

export async function getResources() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      regions:region_id (name)
    `)
    .order('status', { ascending: true })

  if (error) return []
  return data
}

// INSERTION & MANAGEMENT LOGIC

export async function submitIncident(formData: FormData) {
  const supabase = await createClient()
  const itype = formData.get('itype')
  const description = formData.get('description')
  let latitude: any = formData.get('latitude')
  let longitude: any = formData.get('longitude')
  const photo = formData.get('photo') as File | null
  const { data: { user } } = await supabase.auth.getUser()

  if (user && (!latitude || !longitude || (latitude === '6.9271' && longitude === '79.8612'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_location_lat, last_location_lng')
      .eq('id', user.id)
      .single()
      
    if (profile?.last_location_lat && profile?.last_location_lng) {
      latitude = profile.last_location_lat
      longitude = profile.last_location_lng
    }
  }

  // Upload photo to Supabase Storage if provided
  let evidence_photo_url: string | null = null
  if (photo && photo.size > 0) {
    const fileExt = photo.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const filePath = `incidents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('incident-photos')
      .upload(filePath, photo, {
        cacheControl: '3600',
        upsert: false
      })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('incident-photos')
        .getPublicUrl(filePath)
      evidence_photo_url = urlData.publicUrl
    } else {
      console.error('Photo upload error:', uploadError)
    }
  }

  const { error } = await supabase.from('incidents').insert({
    itype, description, latitude, longitude,
    evidence_photo_url,
    reporter_id: user?.id,
    status: 'pending'
  })

  if (error) throw new Error(error.message)
  revalidatePath('/incidents')
  revalidatePath('/authority/incidents')
  revalidatePath('/')
  return { success: true }
}

export async function updateIncidentStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('incidents').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/incidents')
  revalidatePath('/authority/incidents')
  revalidatePath('/authority/dashboard')
  return { success: true }
}

export async function deleteIncident(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('incidents').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/incidents')
  revalidatePath('/authority/incidents')
  return { success: true }
}

export async function submitSOS(formData: FormData) {
  const supabase = await createClient()
  const stype = formData.get('stype')
  const additional_info = formData.get('additional_info')
  let latitude: any = formData.get('latitude')
  let longitude: any = formData.get('longitude')
  const { data: { user } } = await supabase.auth.getUser()

  if (user && (!latitude || !longitude || (latitude === '6.9271' && longitude === '79.8612'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_location_lat, last_location_lng')
      .eq('id', user.id)
      .single()
      
    if (profile?.last_location_lat && profile?.last_location_lng) {
      latitude = profile.last_location_lat
      longitude = profile.last_location_lng
    }
  }

  const { error } = await supabase.from('sos_requests').insert({
    stype, additional_info, latitude, longitude,
    user_id: user?.id,
    status: 'active'
  })

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/authority/dashboard')
  return { success: true }
}

export async function resolveSOS(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sos_requests').update({ status: 'resolved' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/authority/dashboard')
  return { success: true }
}

export async function deleteSOS(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sos_requests').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/authority/dashboard')
  return { success: true }
}

export async function addResource(formData: FormData) {
  const supabase = await createClient()
  const data = Object.fromEntries(formData)
  const { error } = await supabase.from('resources').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/people-needs')
  revalidatePath('/authority/resources')
  return { success: true }
}

export async function updateResourceStock(id: string, quantity: number, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('resources').update({ quantity, status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/people-needs')
  revalidatePath('/authority/resources')
  return { success: true }
}

export async function deleteResource(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/authority/resources')
  return { success: true }
}

export async function addHazard(formData: FormData) {
  const supabase = await createClient()
  const data = Object.fromEntries(formData)
  const { error } = await supabase.from('hazards').insert({ ...data, status: 'active' })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/news')
  revalidatePath('/authority/hazards')
  return { success: true }
}

export async function resolveHazard(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('hazards').update({ status: 'resolved' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/authority/hazards')
  revalidatePath('/authority/dashboard')
  return { success: true }
}

export async function deleteHazard(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('hazards').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/authority/hazards')
  return { success: true }
}

export async function addOfficialUpdate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const entry = Object.fromEntries(formData)
  const { error } = await supabase.from('official_updates').insert({
    title: entry.title,
    content: entry.content,
    severity: entry.severity || 'info',
    authority_id: user.id
  })

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/news')
  return { success: true }
}

export async function getHourlyActivityStats() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_hourly_stats')
  if (error) return []
  return data
}

export async function updateUserLocation(lat: number, lng: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      last_location_lat: lat,
      last_location_lng: lng
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile location:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
