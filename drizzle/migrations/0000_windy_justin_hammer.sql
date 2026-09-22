CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"ceo_name" varchar(100) NOT NULL,
	"manager_name" varchar(100) NOT NULL,
	"ceo_phone" varchar(20) NOT NULL,
	"manager_phone" varchar(20) NOT NULL,
	"business_model" varchar(30) NOT NULL,
	"ceo_card_path" text NOT NULL,
	"manager_card_path" text NOT NULL,
	"ir_deck_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
