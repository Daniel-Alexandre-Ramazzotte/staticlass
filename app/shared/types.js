/**
 * Shared API response shapes used by both web (app/web) and mobile (app/frontend).
 * These are JSDoc types — import with @typedef if you need them in JS files,
 * or convert to .ts if the consuming app uses TypeScript.
 */

/**
 * @typedef {'aluno' | 'professor' | 'admin'} UserRole
 */

/**
 * @typedef {Object} JwtPayload
 * @property {string} sub        - User ID
 * @property {UserRole} role
 * @property {string} email
 * @property {string} name
 * @property {number} exp        - Unix timestamp (seconds)
 */

/**
 * @typedef {Object} Alternative
 * @property {string} letter     - 'A' | 'B' | 'C' | 'D' | 'E'
 * @property {string} text
 * @property {boolean} is_correct
 */

/**
 * @typedef {Object} Question
 * @property {number} id
 * @property {string} issue
 * @property {string} correct_answer
 * @property {string|null} solution
 * @property {string|null} image_q
 * @property {string|null} image_s
 * @property {number} difficulty   - 1=Fácil, 2=Médio, 3=Difícil
 * @property {number|null} chapter_id
 * @property {string|null} chapter_name
 * @property {number|null} topic_id
 * @property {string|null} topic_name
 * @property {string|null} section
 * @property {string|null} source
 * @property {Alternative[]} alternatives
 */

/**
 * @typedef {Object} Chapter
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} Topic
 * @property {number} id
 * @property {string} name
 * @property {number} chapter_id
 */

/**
 * @typedef {'draft' | 'published' | 'closed'} ListStatus
 */

/**
 * @typedef {Object} Lista
 * @property {number} id
 * @property {string} title
 * @property {ListStatus} status
 * @property {string|null} deadline
 * @property {number|null} turma_id
 * @property {string|null} turma_name
 * @property {number} submission_count
 * @property {number|null} avg_score
 */

/**
 * @typedef {Object} AssignedLista
 * @property {number} id
 * @property {string} title
 * @property {ListStatus} status
 * @property {string|null} deadline
 * @property {string|null} professor_name
 * @property {{ score: number|null }|null} my_submission
 */

/**
 * @typedef {Object} Turma
 * @property {number} id
 * @property {string} name
 * @property {number} student_count
 * @property {User[]} [alunos]
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {boolean} active
 * @property {number} [xp]
 * @property {number} [streak]
 */

/**
 * @typedef {Object} RankingEntry
 * @property {number} user_id
 * @property {string} name
 * @property {string} email
 * @property {number} xp
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} active_users
 * @property {number} total_answers
 * @property {number} accuracy       - 0–1 float
 * @property {number} avg_streak
 * @property {TopicAccuracy[]} accuracy_by_topic
 */

/**
 * @typedef {Object} TopicAccuracy
 * @property {string} topic
 * @property {number} attempts
 * @property {number} accuracy  - 0–1 float
 */

/**
 * @typedef {Object} UserProfile
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 * @property {number} xp
 * @property {number} streak
 * @property {number} accuracy
 * @property {TopicAccuracy[]} topics
 */
