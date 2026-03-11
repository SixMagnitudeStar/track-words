import sys
import os
import sqlite3

def update_schemas():
    path = '../track-words-backend/schemas/schema.py'
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'mark_id: Optional[str] = None' not in content:
        content = content.replace('word: str', 'word: str\n    mark_id: Optional[str] = None')
        content = content.replace('next_index: Optional[int] = None', 'next_index: Optional[int] = None\n    mark_id: Optional[str] = None')
        content = content.replace('translation: Optional[str] = None', 'translation: Optional[str] = None\n    mark_id: Optional[str] = None')
        content = content.replace('marked: bool', 'marked: bool\n    mark_id: Optional[str] = None')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def update_routers():
    path = '../track-words-backend/routers/article.py'
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'mark_id=req.mark_id' not in content:
        content = content.replace(
            'new_item = MarkedWord(user_id=current_user.id, article_id=req.article_id, word=req.word)',
            'new_item = MarkedWord(user_id=current_user.id, article_id=req.article_id, word=req.word, mark_id=req.mark_id)'
        )
    if 'block.mark_id = data.mark_id' not in content:
        content = content.replace(
            'block.marked = data.marked',
            'block.marked = data.marked\n    block.mark_id = data.mark_id'
        )
    if '/article/unmark-group/{mark_id}' not in content:
        unmark_api = """
@router.patch("/article/unmark-group/{mark_id}")
def unmark_group(mark_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(ArticleBlock).filter(
        ArticleBlock.mark_id == mark_id,
        ArticleBlock.user_id == current_user.id
    ).update({ArticleBlock.marked: False, ArticleBlock.mark_id: None})
    db.query(MarkedWord).filter(
        MarkedWord.mark_id == mark_id,
        MarkedWord.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "Group unmarked successfully", "mark_id": mark_id}
"""
        content += unmark_api
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def update_db():
    db_path = '../track-words-backend/app.db'
    if not os.path.exists(db_path): return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE article_block ADD COLUMN mark_id TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE marked_words ADD COLUMN mark_id TEXT")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_schemas()
    update_routers()
    update_db()
    print("Backend update completed successfully.")
