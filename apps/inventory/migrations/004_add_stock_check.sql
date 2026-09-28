ALTER TABLE stock_items
  ADD CONSTRAINT stock_items_on_hand_non_negative CHECK (on_hand >= 0),
  ADD CONSTRAINT stock_items_allocated_non_negative CHECK (allocated >= 0),
  ADD CONSTRAINT stock_items_on_order_non_negative CHECK (on_order >= 0);
