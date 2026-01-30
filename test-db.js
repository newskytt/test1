import { createClient } from '@supabase/supabase-js';

// 使用你提供的密钥
const supabaseUrl = 'https://mrebkbdeikvchciowdei.supabase.co';
const supabaseKey = 'sb_secret_V1T-BmWCAe9rQi1GNd2ljg_Q-IzGYVC';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // 测试连接
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      
      // 如果表不存在，创建表
      if (error.code === 'PGRST116') {
        console.log('Tables do not exist. Please run the setup-database.sql script in Supabase SQL Editor.');
      }
    } else {
      console.log('Connection successful!');
      console.log('Sample data:', data);
    }
    
    // 测试插入
    console.log('Testing insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{ username: 'test_user_' + Date.now() }])
      .select();
      
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Insert successful:', insertData);
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testConnection();