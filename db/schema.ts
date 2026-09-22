import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const members=sqliteTable('members',{
 id:text('id').primaryKey(),email:text('email').notNull(),name:text('name').notNull(),phone:text('phone').notNull(),brca:text('brca').notNull(),plan:text('plan').notNull(),guardian:text('guardian').notNull().default(''),number:text('number'),status:text('status').notNull().default('pending'),role:text('role').notNull().default('member'),payment:text('payment').notNull().default('unpaid'),expires:text('expires'),created:text('created').notNull()
},t=>[uniqueIndex('members_number_unique').on(t.number),uniqueIndex('members_email_unique').on(t.email)]);
export const series=sqliteTable('series',{id:text('id').primaryKey(),name:text('name').notNull(),created:text('created').notNull()},t=>[uniqueIndex('series_name_unique').on(t.name)]);
export const events=sqliteTable('events',{
 id:text('id').primaryKey(),seriesId:text('series_id').references(()=>series.id),title:text('title').notNull(),description:text('description').notNull(),starts:text('starts').notNull(),ends:text('ends').notNull(),cutoff:text('cutoff').notNull(),capacity:integer('capacity').notNull(),memberPrice:integer('member_price').notNull(),guestPrice:integer('guest_price').notNull(),status:text('status').notNull().default('draft'),created:text('created').notNull()
},t=>[index('events_starts_idx').on(t.starts)]);
export const entries=sqliteTable('entries',{
 id:text('id').primaryKey(),eventId:text('event_id').notNull().references(()=>events.id),userId:text('user_id').notNull(),email:text('email').notNull(),name:text('name').notNull(),brca:text('brca').notNull(),raceClass:text('race_class').notNull(),transponder:text('transponder').notNull().default(''),amount:integer('amount').notNull(),method:text('method').notNull(),payment:text('payment').notNull().default('unpaid'),status:text('status').notNull().default('confirmed'),stripeSession:text('stripe_session'),created:text('created').notNull()
},t=>[uniqueIndex('entries_event_user_unique').on(t.eventId,t.userId),index('entries_user_idx').on(t.userId)]);
export const settings=sqliteTable('settings',{key:text('key').primaryKey(),value:text('value').notNull()});
export const audit=sqliteTable('audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),target:text('target').notNull(),created:text('created').notNull()});
export const resultMeetings=sqliteTable('result_meetings',{
 id:text('id').primaryKey(),title:text('title').notNull(),date:text('date').notNull(),snapshot:text('snapshot').notNull(),importedAt:text('imported_at').notNull(),importedBy:text('imported_by').notNull(),published:integer('published').notNull().default(1),tableCount:integer('table_count').notNull(),rowCount:integer('row_count').notNull()
},t=>[index('result_meetings_date_idx').on(t.date)]);
export const resultPreviews=sqliteTable('result_previews',{
 userId:text('user_id').primaryKey(),token:text('token').notNull(),snapshot:text('snapshot').notNull(),expires:text('expires').notNull()
});
