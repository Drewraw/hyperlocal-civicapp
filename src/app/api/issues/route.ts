// POST /api/issues - Create new issue
// GET /api/issues - Get all issues
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let queryText = `
      SELECT 
        i.*,
        u.name as user_name,
        COUNT(v.id) as upvote_count
      FROM issues i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN votes v ON i.id = v.issue_id AND v.vote_type = 'upvote'
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (area) {
      queryText += ` AND i.area ILIKE $${params.length + 1}`;
      params.push(`%${area}%`);
    }
    
    if (category) {
      queryText += ` AND i.category = $${params.length + 1}`;
      params.push(category);
    }
    
    if (status) {
      queryText += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }
    
    queryText += `
      GROUP BY i.id, u.name
      ORDER BY i.created_at DESC
    `;
    
    const result = await query(queryText, params);
    
    // Get comments for each issue
    for (let issue of result.rows) {
      const commentsResult = await query(`
        SELECT c.*, u.name as user_name 
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.issue_id = $1
        ORDER BY c.created_at ASC
      `, [issue.id]);
      issue.comments = commentsResult.rows;
    }
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, category, title, description, area, latitude, longitude } = await request.json();
    
    if (!user_id || !category || !description || !area) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert issue
    const issueResult = await query(`
      INSERT INTO issues (user_id, category, title, description, area, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [user_id, category, title || 'Issue Report', description, area, latitude || null, longitude || null]);
    
    const issue = issueResult.rows[0];
    
    // Add AI comment
    await query(`
      INSERT INTO comments (issue_id, content, is_official)
      VALUES ($1, $2, $3)
    `, [issue.id, 'Report logged! Notifying nearby users. We\'ll follow up in 48 hours.', true]);
    
    return NextResponse.json({ 
      message: 'Issue created successfully', 
      issue 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}