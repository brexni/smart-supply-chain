-- ============================================
-- RLS 策略测试脚本
-- 用于验证 Row Level Security 是否正常工作
-- ============================================

-- 1. 检查 RLS 状态
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ 已启用'
        ELSE '❌ 未启用'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. 查看所有策略
SELECT 
    tablename as "表名",
    policyname as "策略名称",
    cmd as "操作",
    roles as "角色",
    CASE 
        WHEN qual = 'true' THEN '✅ 无限制'
        WHEN qual IS NULL THEN '⚠️  无读取条件'
        ELSE qual 
    END as "读取条件",
    CASE 
        WHEN with_check = 'true' THEN '✅ 无限制'
        WHEN with_check IS NULL THEN '⚠️  无写入条件'
        ELSE with_check 
    END as "写入条件"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, 
         CASE cmd
             WHEN 'SELECT' THEN 1
             WHEN 'INSERT' THEN 2
             WHEN 'UPDATE' THEN 3
             WHEN 'DELETE' THEN 4
         END;

-- 3. 统计每个表的策略数量
SELECT 
    tablename as "表名",
    COUNT(*) as "策略数量",
    STRING_AGG(DISTINCT cmd::text, ', ') as "涵盖操作"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. 测试查询权限(以当前角色)
SELECT '当前角色可以查询的数据:' as "测试结果";

SELECT 
    'Table' as "表名",
    COUNT(*) as "可见行数"
FROM "Table"
UNION ALL
SELECT 
    'Field',
    COUNT(*)
FROM "Field"
UNION ALL
SELECT 
    'Record',
    COUNT(*)
FROM "Record";

-- 5. 模拟匿名用户测试(需要权限)
DO $$
BEGIN
    -- 切换到匿名角色
    EXECUTE 'SET ROLE anon';
    
    RAISE NOTICE '匿名用户测试:';
    
    -- 测试查询
    PERFORM COUNT(*) FROM "Table";
    RAISE NOTICE '✅ 可以查询 Table 表';
    
    PERFORM COUNT(*) FROM "Field";
    RAISE NOTICE '✅ 可以查询 Field 表';
    
    PERFORM COUNT(*) FROM "Record";
    RAISE NOTICE '✅ 可以查询 Record 表';
    
    -- 重置角色
    EXECUTE 'RESET ROLE';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ 匿名用户测试失败: %', SQLERRM;
    EXECUTE 'RESET ROLE';
END $$;

-- 6. 检查缺失的策略
WITH all_tables AS (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
),
required_operations AS (
    SELECT unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as operation
),
all_combinations AS (
    SELECT t.tablename, r.operation
    FROM all_tables t
    CROSS JOIN required_operations r
),
existing_policies AS (
    SELECT tablename, cmd as operation
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT 
    ac.tablename as "表名",
    ac.operation as "缺失操作"
FROM all_combinations ac
LEFT JOIN existing_policies ep 
    ON ac.tablename = ep.tablename 
    AND ac.operation = ep.operation
WHERE ep.operation IS NULL
ORDER BY ac.tablename, ac.operation;

-- 7. 性能影响分析
EXPLAIN ANALYZE
SELECT t.*, COUNT(r.id) as record_count
FROM "Table" t
LEFT JOIN "Record" r ON r.table_id = t.id
GROUP BY t.id;

-- 8. 总结
SELECT 
    '✅ RLS 配置完成!' as "状态",
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as "策略总数",
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as "启用RLS的表数";
