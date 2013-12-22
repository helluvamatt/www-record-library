create or replace function new_session_id()
returns text as $test$
	declare
		sessionid		text;
		holder			text;
	begin
		loop
			select md5(random()::text) into sessionid;
			select sess_id into holder from sessions.session
				where sess_id = sessionid;
			if found then
				continue;
			else
				return sessionid;
			end if;
		end loop;
	end;
$test$ language plpgsql;

drop schema if exists sessions cascade;

create schema sessions;
create table sessions.session(sess_id text primary key, sess_data text, expiration timestamp with time zone default now() + interval '1 day');
create index expire_idx on sessions.session (expiration);
drop function if exists sessions.all_session_ids();
create or replace function sessions.valid_sessions()
returns setof sessions.session as $$
	begin
		return query select * from sessions.session
			where expiration > now() 
				or expiration is null;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;
		
create or replace function sessions.set_session_data(
	sessid text, 
	sessdata text, 
	expire timestamp with time zone) 
returns void as $$
	begin
		loop
			update sessions.session 
				set sess_data = sessdata, 
					expiration = expire 
				where sess_id = sessid;
			if found then
				return;
			end if;
			begin
				insert into sessions.session (sess_id, sess_data, expiration) 
					values (sessid, sessdata, expire);
				return;
			exception
				when unique_violation then
					-- do nothing.
			end;
		end loop;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;
		
create or replace function sessions.destroy_session(sessid text)
returns void as $$
	begin
		delete from sessions.session where sess_id = sessid;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;
		
create or replace function sessions.get_session_data(sessid text)
returns setof text as $$
	begin
		return query select sess_data 
			from sessions.valid_sessions()
			where sess_id = sessid;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;
		
create or replace function sessions.clear_sessions()
returns void as $$
	begin 
		delete from sessions.session;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;

create or replace function sessions.count_sessions()
returns int as $$
	declare
		thecount int := 0;
	begin
		select count(*) into thecount
			from sessions.valid_sessions();
		return thecount;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;

drop trigger if exists delete_expired_trig on sessions.session;
create or replace function sessions.remove_expired()
returns trigger as $$
	begin
		delete from sessions.session where expiration < now();
		return null;
	end;
$$ language plpgsql security definer
set search_path = sessions, pg_temp;
create trigger delete_expired_trig
	after insert or update
	on sessions.session
	execute procedure sessions.remove_expired();

revoke all on function 
	sessions.valid_sessions(),
	sessions.set_session_data(
		sessid text, 
		sessdata text, 
		expire timestamp with time zone),
	sessions.destroy_session(sessid text),
	sessions.get_session_data(sessid text),
	sessions.clear_sessions(),
	sessions.count_sessions(),
	sessions.remove_expired()
from public;

