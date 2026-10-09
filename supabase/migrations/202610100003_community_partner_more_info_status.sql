-- The Community Partners application review flow supports requesting more
-- information from an applicant. Keep this enum change isolated so the value
-- is committed before review RPCs begin writing it.
alter type public.group_approval_status add value if not exists 'more_info';
