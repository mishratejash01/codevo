/**
 * Maps form_type to the corresponding registration table name.
 * Handles specific mappings and defaults to suffixing with '_registrations'.
 */
export function getRegistrationTable(formType: string | null | undefined): string {
  const type = formType?.toLowerCase() || 'normal';
  const tableMap: Record<string, string> = {
    'workshop': 'workshop_registrations',
    'webinar': 'webinar_registrations',
    'meetup': 'meetup_registrations',
    'contest': 'contest_registrations',
    'hackathon': 'event_registrations',
    'normal': 'event_registrations',
    '': 'event_registrations',
  };
  return tableMap[type] || `${type}_registrations`;
}

/**
 * Maps form_type to the corresponding database RPC for marking attendance.
 */
export function getAttendanceRPC(formType: string | null | undefined): string {
  const type = formType?.toLowerCase() || 'normal';
  const rpcMap: Record<string, string> = {
    'hackathon': 'mark_as_attended',
    'normal': 'mark_as_attended',
    '': 'mark_as_attended',
  };
  return rpcMap[type] || `mark_${type}_attended`;
}

/**
 * Checks if the event type supports team functionality
 */
export function supportsTeams(formType: string | null | undefined): boolean {
  const teamTypes = ['hackathon', 'normal', ''];
  return teamTypes.includes(formType?.toLowerCase() || '');
}
