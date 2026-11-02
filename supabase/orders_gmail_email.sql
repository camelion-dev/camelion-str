-- Require Gmail addresses for every order written to the database.
alter table public."Order"
  add constraint "Order_customerEmail_gmail_check"
  check ("customerEmail" ~* '^[a-z0-9._%+-]+@gmail[.]com$') not valid;

alter table public."Order"
  validate constraint "Order_customerEmail_gmail_check";