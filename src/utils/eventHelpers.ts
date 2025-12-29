/**
 * Maps form_type to the corresponding registration table name
 */
export function getRegistrationTable(formType: string | null | undefined): string {
  const tableMap: Record<string, string> = {
    'workshop': 'workshop_registrations',
    'webinar': 'webinar_registrations',
    'meetup': 'meetup_registrations',
    'contest': 'contest_registrations',
    'hackathon': 'event_registrations',
    'normal': 'event_registrations',
  };
  return tableMap[formType?.toLowerCase() || ''] || 'event_registrations';
}

/**
 * Checks if the event type supports team functionality
 */
export function supportsTeams(formType: string | null | undefined): boolean {
  const teamTypes = ['hackathon', 'normal', ''];
  return teamTypes.includes(formType?.toLowerCase() || '');
}
