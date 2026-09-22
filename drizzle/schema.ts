import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  companyName: text('company_name').notNull(),
  ceoName: varchar('ceo_name', { length: 100 }).notNull(),
  managerName: varchar('manager_name', { length: 100 }).notNull(),
  ceoPhone: varchar('ceo_phone', { length: 20 }).notNull(),
  managerPhone: varchar('manager_phone', { length: 20 }).notNull(),
  businessModel: varchar('business_model', { length: 30 }).notNull(),
  // Storage 업로드 후 반환되는 경로/URL을 저장합니다.
  ceoCardPath: text('ceo_card_path').notNull(),
  managerCardPath: text('manager_card_path').notNull(),
  irDeckPath: text('ir_deck_path').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const applicationNotes = pgTable('application_notes', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
