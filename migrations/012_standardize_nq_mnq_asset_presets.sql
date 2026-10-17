UPDATE asset_presets
SET tick_size = 0.25,
    dollar_per_point = CASE WHEN symbol = 'NQ1' THEN 20 ELSE 2 END,
    commission_amount = CASE WHEN symbol = 'NQ1' THEN 4.68 ELSE 1.9 END
WHERE symbol IN ('NQ1', 'MNQ1');
