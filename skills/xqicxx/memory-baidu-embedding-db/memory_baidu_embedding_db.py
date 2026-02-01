"""
百度Embedding内存数据库
用于替代memory-lancedb的向量内存系统
"""

import json
import os
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pathlib import Path

# 导入百度Embedding客户端
import sys
sys.path.append('/root/clawd/skills/baidu-vector-db/')
from baidu_embedding_bce_v3 import BaiduEmbeddingBCEV3


class MemoryBaiduEmbeddingDB:
    """
    基于百度Embedding的内存数据库
    用于替代LanceDB内存系统
    """
    
    def __init__(self, db_path: str = None):
        """
        初始化内存数据库
        
        Args:
            db_path: SQLite数据库路径
        """
        # 从环境变量或配置文件加载API凭据
        api_string = os.getenv("BAIDU_API_STRING")
        secret_key = os.getenv("BAIDU_SECRET_KEY")
        
        # 检查API凭据是否存在
        if not api_string or not secret_key:
            print("❌ 错误: 缺少必要的API凭据!")
            print("   请设置以下环境变量:")
            print("   export BAIDU_API_STRING='your_bce_v3_api_string'")
            print("   export BAIDU_SECRET_KEY='your_secret_key'")
            print("   您可以从 https://console.bce.baidu.com/qianfan/ 获取API凭据")
            raise ValueError("缺少百度API凭据")
        
        self.client = BaiduEmbeddingBCEV3(api_string, secret_key)
        
        # 设置数据库路径
        self.db_path = db_path or os.path.join(os.path.expanduser("~"), ".clawd", "memory_baidu.db")
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        # 初始化数据库
        self._init_db()
    
    def _init_db(self):
        """
        初始化SQLite数据库
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 创建记忆表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    embedding_json TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    tags TEXT,
                    metadata_json TEXT
                )
            ''')
            
            # 创建索引
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tags ON memories(tags)')
            
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"❌ 数据库初始化错误: {str(e)}")
            print(f"   请检查数据库路径是否有效: {self.db_path}")
            print("   可能的原因: 权限不足、磁盘空间不足或路径不存在")
            raise
        except Exception as e:
            print(f"❌ 初始化数据库时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            raise
    
    def _calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        计算两个向量之间的余弦相似性
        
        Args:
            vec1: 第一个向量
            vec2: 第二个向量
            
        Returns:
            相似性分数 (0-1之间)
        """
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def add_memory(self, content: str, tags: List[str] = None, metadata: Dict = None) -> bool:
        """
        添加记忆到数据库
        
        Args:
            content: 记忆内容
            tags: 标签列表
            metadata: 元数据
            
        Returns:
            是否添加成功
        """
        try:
            # 输入验证
            if not content or not isinstance(content, str):
                print("❌ 错误: 内容不能为空且必须是字符串")
                return False
            
            if len(content) > 10000:  # 限制内容长度
                print("❌ 错误: 内容过长，请保持在10000字符以内")
                return False
                
            if tags is not None and not isinstance(tags, list):
                print("❌ 错误: 标签必须是字符串列表")
                return False
                
            if metadata is not None and not isinstance(metadata, dict):
                print("❌ 错误: 元数据必须是字典类型")
                return False

            # 生成向量表示
            embedding = self.client.get_embedding_vector(content, model="embedding-v1")
            if not embedding:
                print(f"❌ 无法为内容生成向量: {content[:50]}...")
                print("   可能原因: API调用失败、网络问题或内容格式不支持")
                return False
        
            # 转换为JSON字符串
            try:
                embedding_json = json.dumps(embedding)
                tags_str = ",".join(tags) if tags else ""
                metadata_json = json.dumps(metadata) if metadata else "{}"
            except TypeError as e:
                print(f"❌ 数据序列化错误: {str(e)}")
                return False
        
            # 插入数据库
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    INSERT INTO memories (content, embedding_json, tags, metadata_json)
                    VALUES (?, ?, ?, ?)
                ''', (content, embedding_json, tags_str, metadata_json))
                
                conn.commit()
                print(f"✅ 已添加记忆: {content[:50]}{'...' if len(content) > 50 else ''}")
                return True
            except sqlite3.Error as e:
                print(f"❌ 数据库插入错误: {str(e)}")
                print("   可能原因: 数据库权限不足、磁盘空间不足或数据库损坏")
                return False
            finally:
                conn.close()
                
        except Exception as e:
            print(f"❌ 添加记忆时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            return False
    
    def search_memories(self, query: str, limit: int = 5, tags: List[str] = None) -> List[Dict]:
        """
        通过语义搜索相关记忆
        
        Args:
            query: 搜索查询
            limit: 返回结果数量限制
            tags: 标签过滤条件
            
        Returns:
            相关记忆列表
        """
        try:
            # 输入验证
            if not query or not isinstance(query, str):
                print("❌ 错误: 查询不能为空且必须是字符串")
                return []
                
            if limit <= 0 or limit > 100:
                print("❌ 错误: 结果数量限制必须在1-100之间")
                return []
                
            if tags is not None and not isinstance(tags, list):
                print("❌ 错误: 标签必须是字符串列表")
                return []

            # 生成查询向量
            query_embedding = self.client.get_embedding_vector(query, model="embedding-v1")
            if not query_embedding:
                print("❌ 无法为查询生成向量")
                print("   可能原因: API调用失败、网络问题或查询内容格式不支持")
                return []
        
            # 从数据库获取所有记忆
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                # 构建查询条件
                where_clause = "WHERE 1=1"
                params = []
                
                if tags:
                    # 为每个标签构建OR条件
                    tag_conditions = []
                    for tag in tags:
                        tag_conditions.extend(["tags LIKE ?", "tags LIKE ?", "tags LIKE ?"])
                        params.extend([f'%{tag}%', f'{tag},%', f'%,{tag}%'])
                    
                    if tag_conditions:
                        where_clause += f" AND ({' OR '.join(tag_conditions)})"
                
                cursor.execute(f'''
                    SELECT id, content, embedding_json, timestamp, tags, metadata_json
                    FROM memories
                    {where_clause}
                    ORDER BY timestamp DESC
                ''', params)
                
                rows = cursor.fetchall()
            except sqlite3.Error as e:
                print(f"❌ 数据库查询错误: {str(e)}")
                print("   可能原因: 数据库损坏、权限问题或SQL语法错误")
                return []
            finally:
                conn.close()
            
            # 计算与查询向量的相似性
            results = []
            for row in rows:
                try:
                    embedding = json.loads(row[2])
                    similarity = self._calculate_similarity(query_embedding, embedding)
                    
                    results.append({
                        "id": row[0],
                        "content": row[1],
                        "similarity": similarity,
                        "timestamp": row[3],
                        "tags": row[4],
                        "metadata": json.loads(row[5]) if row[5] else {},
                    })
                except json.JSONDecodeError:
                    print(f"⚠️ 警告: 无法解析记忆ID {row[0]} 的嵌入向量，跳过该记录")
                    continue
                except Exception as e:
                    print(f"⚠️ 警告: 处理记忆ID {row[0]} 时出错: {str(e)}，跳过该记录")
                    continue
            
            # 按相似性排序并返回前N个结果
            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results[:limit]
            
        except Exception as e:
            print(f"❌ 搜索记忆时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            return []
    
    def retrieve_similar_memories(self, content: str, limit: int = 5) -> List[Dict]:
        """
        检索与指定内容相似的记忆
        
        Args:
            content: 用于检索的内容
            limit: 返回结果数量限制
            
        Returns:
            相似记忆列表
        """
        return self.search_memories(content, limit=limit)
    
    def get_all_memories(self) -> List[Dict]:
        """
        获取所有记忆（不分页）
        
        Returns:
            所有记忆列表
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, content, embedding_json, timestamp, tags, metadata_json
                FROM memories
                ORDER BY timestamp DESC
            ''')
            
            rows = cursor.fetchall()
            conn.close()
            
            results = []
            for row in rows:
                try:
                    results.append({
                        "id": row[0],
                        "content": row[1],
                        "embedding_json": row[2],  # 保留原始JSON以便需要时转换
                        "timestamp": row[3],
                        "tags": row[4],
                        "metadata": json.loads(row[5]) if row[5] else {},
                    })
                except json.JSONDecodeError:
                    print(f"⚠️ 警告: 无法解析记忆ID {row[0]} 的元数据，使用空字典")
                    results.append({
                        "id": row[0],
                        "content": row[1],
                        "embedding_json": row[2],
                        "timestamp": row[3],
                        "tags": row[4],
                        "metadata": {},
                    })
                except Exception as e:
                    print(f"⚠️ 警告: 处理记忆ID {row[0]} 时出错: {str(e)}，跳过该记录")
                    continue
            
            return results
            
        except sqlite3.Error as e:
            print(f"❌ 获取所有记忆时数据库错误: {str(e)}")
            print("   可能原因: 数据库损坏、权限问题或连接失败")
            return []
        except Exception as e:
            print(f"❌ 获取所有记忆时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            return []
    
    def delete_memory(self, memory_id: int) -> bool:
        """
        删除指定ID的记忆
        
        Args:
            memory_id: 记忆ID
            
        Returns:
            是否删除成功
        """
        try:
            # 输入验证
            if not isinstance(memory_id, int) or memory_id <= 0:
                print("❌ 错误: 记忆ID必须是正整数")
                return False

            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('DELETE FROM memories WHERE id = ?', (memory_id,))
                conn.commit()
                
                if cursor.rowcount > 0:
                    print(f"✅ 已删除记忆ID: {memory_id}")
                    return True
                else:
                    print(f"⚠️ 未找到ID为 {memory_id} 的记忆")
                    return False
            except sqlite3.Error as e:
                print(f"❌ 数据库删除操作错误: {str(e)}")
                print("   可能原因: 数据库权限不足或数据库损坏")
                return False
            finally:
                conn.close()
                
        except Exception as e:
            print(f"❌ 删除记忆时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            return False
    
    def clear_all_memories(self) -> bool:
        """
        清空所有记忆
        
        Returns:
            是否清空成功
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('DELETE FROM memories')
                conn.commit()
                print("✅ 已清空所有记忆")
                return True
            except sqlite3.Error as e:
                print(f"❌ 数据库清空操作错误: {str(e)}")
                print("   可能原因: 数据库权限不足或数据库损坏")
                return False
            finally:
                conn.close()
                
        except Exception as e:
            print(f"❌ 清空所有记忆时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            return False
    
    def get_statistics(self) -> Dict:
        """
        获取数据库统计信息
        
        Returns:
            统计信息字典
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 总记忆数
            cursor.execute('SELECT COUNT(*) FROM memories')
            total_memories = cursor.fetchone()[0]
            
            # 按标签分组统计
            cursor.execute('SELECT tags, COUNT(*) FROM memories GROUP BY tags')
            tag_rows = cursor.fetchall()
            tag_counts = dict(tag_rows) if tag_rows else {}
            
            # 最早和最新的记忆时间
            cursor.execute('SELECT MIN(timestamp), MAX(timestamp) FROM memories')
            min_max_result = cursor.fetchone()
            min_time, max_time = min_max_result if min_max_result else (None, None)
            
            conn.close()
            
            return {
                "total_memories": total_memories,
                "tag_distribution": tag_counts,
                "earliest_memory": min_time,
                "latest_memory": max_time
            }
            
        except sqlite3.Error as e:
            print(f"❌ 获取统计数据时数据库错误: {str(e)}")
            print("   可能原因: 数据库损坏、权限问题或连接失败")
            return {
                "total_memories": 0,
                "tag_distribution": {},
                "earliest_memory": None,
                "latest_memory": None
            }
        except Exception as e:
            print(f"❌ 获取统计数据时发生未知错误: {str(e)}")
            print("   详细错误信息:")
            traceback.print_exc()
            return {
                "total_memories": 0,
                "tag_distribution": {},
                "earliest_memory": None,
                "latest_memory": None
            }


def main():
    """
    主函数 - 演示百度Embedding内存数据库功能
    """
    print("🤖 百度Embedding内存数据库")
    print("="*60)
    
    try:
        # 创建内存数据库实例
        mem_db = MemoryBaiduEmbeddingDB()
        
        print("\n📊 数据库统计信息:")
        stats = mem_db.get_statistics()
        print(f"  总记忆数: {stats['total_memories']}")
        print(f"  标签分布: {stats['tag_distribution']}")
        print(f"  最早记忆: {stats['earliest_memory']}")
        print(f"  最新记忆: {stats['latest_memory']}")
        
        print("\n📝 添加记忆示例:")
        # 添加一些示例记忆
        examples = [
            {
                "content": "用户喜欢健身，特别关注胸肌和背肌训练，不喜欢练斜方肌",
                "tags": ["user-preference", "fitness"],
                "metadata": {"user": "九十", "date": "2026-01-30"}
            },
            {
                "content": "今天的天气很好，适合户外运动",
                "tags": ["weather", "activity"],
                "metadata": {"date": "2026-01-30"}
            },
            {
                "content": "用户的目标是读书500本、观影2000部、创作20首歌、储蓄50万、学一门外语",
                "tags": ["user-goal", "long-term"],
                "metadata": {"user": "九十", "priority": "high"}
            }
        ]
        
        for example in examples:
            success = mem_db.add_memory(
                example["content"],
                example["tags"],
                example["metadata"]
            )
            print(f"  添加记忆: {'✅' if success else '❌'} - {example['content'][:30]}...")
        
        print("\n🔍 语义搜索示例:")
        # 搜索相关记忆
        search_queries = [
            "用户健身偏好",
            "读书和外语学习目标",
            "今天的活动建议"
        ]
        
        for query in search_queries:
            print(f"\n  搜索: '{query}'")
            results = mem_db.search_memories(query, limit=2)
            if results:
                for i, result in enumerate(results, 1):
                    print(f"    {i}. 相似度: {result['similarity']:.3f} - {result['content'][:50]}...")
            else:
                print("    未找到相关记忆")
        
        print(f"\n🎉 百度Embedding内存数据库演示完成！")
        print("已成功实现基于向量相似性的智能记忆管理功能")
        
    except ValueError as ve:
        print(f"\n❌ 配置错误: {str(ve)}")
        print("   请确保已正确设置环境变量")
        return 1
    except Exception as e:
        print(f"\n❌ 演示过程中发生错误: {str(e)}")
        print("   详细错误信息:")
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    main()