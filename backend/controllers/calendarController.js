import { getSupabaseClient } from '../database/supabase.js';

export const getCalendarEvents = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const start = (req.query.start || '').trim();
    const end = (req.query.end || '').trim();

    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'start and end are required in YYYY-MM-DD format' });
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('event_date', start)
      .lte('event_date', end)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: true });

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return res.status(500).json({ success: false, message: 'Error fetching calendar events', error: error.message });
  }
};

export const createCalendarEvent = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const {
      title,
      description,
      event_date,
      start_time,
      end_time,
      is_all_day,
      status,
      notification_remarks,
      placement_company_name,
      placement_year
    } = req.body || {};

    if (!title || !event_date) {
      return res.status(400).json({ success: false, message: 'title and event_date are required' });
    }

    const payload = {
      title,
      description: description || null,
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      is_all_day: !!is_all_day,
      status: status || 'scheduled',
      notification_remarks: notification_remarks || null,
      placement_company_name: placement_company_name || null,
      placement_year: placement_year !== undefined && placement_year !== null ? parseInt(placement_year, 10) : null
    };

    const { data, error } = await supabase
      .from('calendar_events')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return res.status(500).json({ success: false, message: 'Error creating calendar event', error: error.message });
  }
};

export const updateCalendarEvent = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const update = { ...req.body };
    // Normalize optional fields to null when empty strings are passed
    ['description', 'start_time', 'end_time', 'notification_remarks', 'placement_company_name'].forEach((k) => {
      if (update[k] === '') update[k] = null;
    });
    if (update.placement_year === '') update.placement_year = null;
    if (update.placement_year !== undefined && update.placement_year !== null) {
      update.placement_year = parseInt(update.placement_year, 10);
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return res.status(500).json({ success: false, message: 'Error updating calendar event', error: error.message });
  }
};

export const deleteCalendarEvent = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return res.status(500).json({ success: false, message: 'Error deleting calendar event', error: error.message });
  }
};
