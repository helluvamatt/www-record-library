alter function sessions.valid_sessions() owner to recordlibrary;
alter function sessions.set_session_data(sessid text, sessdata text, expire timestamp with time zone) owner to recordlibrary;
alter function sessions.destroy_session(sessid text) owner to recordlibrary;
alter function sessions.get_session_data(sessid text) owner to recordlibrary;
alter function sessions.clear_sessions() owner to recordlibrary;
alter function sessions.count_sessions() owner to recordlibrary;
alter function sessions.remove_expired() owner to recordlibrary;
alter table sessions.session owner to recordlibrary;