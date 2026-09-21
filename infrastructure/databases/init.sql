CREATE DATABASE vendor_db;
CREATE USER vendor_user WITH ENCRYPTED PASSWORD 'vendor_pass';
GRANT ALL PRIVILEGES ON DATABASE vendor_db TO vendor_user;
\connect vendor_db
GRANT ALL ON SCHEMA public TO vendor_user;
ALTER SCHEMA public OWNER TO vendor_user;

CREATE DATABASE procurement_db;
CREATE USER procurement_user WITH ENCRYPTED PASSWORD 'procurement_pass';
GRANT ALL PRIVILEGES ON DATABASE procurement_db TO procurement_user;
\connect procurement_db
GRANT ALL ON SCHEMA public TO procurement_user;
ALTER SCHEMA public OWNER TO procurement_user;

CREATE DATABASE receiving_db;
CREATE USER receiving_user WITH ENCRYPTED PASSWORD 'receiving_pass';
GRANT ALL PRIVILEGES ON DATABASE receiving_db TO receiving_user;
\connect receiving_db
GRANT ALL ON SCHEMA public TO receiving_user;
ALTER SCHEMA public OWNER TO receiving_user;

CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'inventory_pass';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;
\connect inventory_db
GRANT ALL ON SCHEMA public TO inventory_user;
ALTER SCHEMA public OWNER TO inventory_user;

CREATE DATABASE warehouse_db;
CREATE USER warehouse_user WITH ENCRYPTED PASSWORD 'warehouse_pass';
GRANT ALL PRIVILEGES ON DATABASE warehouse_db TO warehouse_user;
\connect warehouse_db
GRANT ALL ON SCHEMA public TO warehouse_user;
ALTER SCHEMA public OWNER TO warehouse_user;

CREATE DATABASE retail_sales_db;
CREATE USER retail_sales_user WITH ENCRYPTED PASSWORD 'retail_sales_pass';
GRANT ALL PRIVILEGES ON DATABASE retail_sales_db TO retail_sales_user;
\connect retail_sales_db
GRANT ALL ON SCHEMA public TO retail_sales_user;
ALTER SCHEMA public OWNER TO retail_sales_user;

CREATE DATABASE sales_audit_db;
CREATE USER sales_audit_user WITH ENCRYPTED PASSWORD 'sales_audit_pass';
GRANT ALL PRIVILEGES ON DATABASE sales_audit_db TO sales_audit_user;
\connect sales_audit_db
GRANT ALL ON SCHEMA public TO sales_audit_user;
ALTER SCHEMA public OWNER TO sales_audit_user;

CREATE DATABASE financials_db;
CREATE USER financials_user WITH ENCRYPTED PASSWORD 'financials_pass';
GRANT ALL PRIVILEGES ON DATABASE financials_db TO financials_user;
\connect financials_db
GRANT ALL ON SCHEMA public TO financials_user;
ALTER SCHEMA public OWNER TO financials_user;
