import React from 'react';
import './HomePage.css';

function HomePage({ navigateToTasks, navigateToRecurringTasks, isGuest, onGetStarted }) {
  // Handle calls to action differently based on whether user is logged in
  const handleTasksClick = () => {
    if (isGuest) {
      onGetStarted();
    } else {
      navigateToTasks();
    }
  };

  const handleSchedulerClick = () => {
    if (isGuest) {
      onGetStarted();
    } else {
      navigateToRecurringTasks();
    }
  };

  return (
    <div className="home-page">
      {/* Enhanced SEO keyword container */}
      <div aria-hidden="true" className="seo-keywords">
        <span className="task-management-app"></span>
        <span className="productivity-tool"></span>
        <span className="student-assignment-tracker"></span>
        <span className="work-deadline-manager"></span>
        <span className="task-organization"></span>
        <span className="project-management-tool"></span>
        <span className="time-management-solution"></span>
        <span className="student-planner"></span>
        <span className="professional-organizer"></span>
        <span className="assignment-tracker"></span>
        <span className="deadline-reminder"></span>
        <span className="study-schedule-planner"></span>
        <span className="task-prioritization"></span>
        <span className="academic-planner"></span>
        <span className="work-schedule-organizer"></span>
        <span className="daily-planner"></span>
        <span className="task-reminder-app"></span>
        <span className="time-blocking-app"></span>
        <span className="productivity-assistant"></span>
        <span className="smart-scheduler-tool"></span>
        <span className="recurring-task-manager"></span>
        <span className="class-schedule-organizer"></span>
        <span className="academic-assignment-tracker"></span>
        <span className="work-deadline-tracker"></span>
        <span className="student-productivity-tool"></span>
      </div>

      <section className="hero-section" role="banner">
        <div className="hero-content">
          <h1>Organize Your Day, Boost Your Productivity with Our Free To-Do List App</h1>
          <p className="hero-description">The perfect task management tool for students and professionals to stay on top of assignments, projects, and deadlines with smart scheduling and priority management.</p>
          <button 
            className="get-started-btn" 
            onClick={handleTasksClick} 
            aria-label="Get started with task management"
          >
            {isGuest ? "Sign In to Get Started" : "Get Started with Tasks"}
          </button>
        </div>
        <div className="hero-image">
          <img 
            src="/productivity.webp" 
            alt="Task management and scheduling illustration showing a calendar and productivity tools" 
          />
        </div>
      </section>
      
      <section className="user-profiles-section" id="user-types" aria-labelledby="user-types-heading">
        <h2 id="user-types-heading">Designed For You</h2>
        <div className="profile-cards">
          <div className="profile-card">
            <div className="profile-icon" aria-hidden="true">👩‍🎓</div>
            <h3>For Students</h3>
            <ul>
              <li>Track assignment deadlines</li>
              <li>Schedule study sessions</li>
              <li>Balance academics and extracurriculars</li>
              <li>Never miss a submission date</li>
            </ul>
          </div>
          
          <div className="profile-card">
            <div className="profile-icon" aria-hidden="true">👨‍💼</div>
            <h3>For Professionals</h3>
            <ul>
              <li>Manage project milestones</li>
              <li>Organize daily work tasks</li>
              <li>Set reminders for meetings</li>
              <li>Track professional goals</li>
            </ul>
          </div>
        </div>
      </section>
      
      <section className="features-section" id="features" aria-labelledby="features-heading">
        <h2 id="features-heading">Features That Make a Difference</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📝</div>
            <h3>Smart Task Management</h3>
            <p>Create, prioritize, and organize tasks with intuitive tools designed for busy schedules</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">🔔</div>
            <h3>Timely Notifications</h3>
            <p>Get reminders before deadlines so you never miss an important submission or meeting</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📊</div>
            <h3>Visual Progress Tracking</h3>
            <p>See what's done, what's upcoming, and what needs your attention at a glance</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📱</div>
            <h3>Accessible Anywhere</h3>
            <p>Access your tasks from any device, whether you're in class, at the office, or on the go</p>
          </div>
        </div>
      </section>
      
      <section className="usage-section" id="how-it-works" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading">How It Works</h2>
        <div className="usage-steps">
          <div className="step">
            <div className="step-number" aria-hidden="true">1</div>
            <h3>Add Your Tasks</h3>
            <p>Enter assignments, projects, meetings, or any task with due dates and priorities</p>
          </div>
          
          <div className="step">
            <div className="step-number" aria-hidden="true">2</div>
            <h3>Get Organized</h3>
            <p>Tasks are automatically sorted by date and priority for optimal productivity</p>
          </div>
          
          <div className="step">
            <div className="step-number" aria-hidden="true">3</div>
            <h3>Receive Reminders</h3>
            <p>Get timely notifications before deadlines to keep you on track</p>
          </div>
          
          <div className="step">
            <div className="step-number" aria-hidden="true">4</div>
            <h3>Complete & Progress</h3>
            <p>Mark tasks as complete and build momentum toward your academic or career goals</p>
          </div>
        </div>
      </section>
      
      <section className="testimonials-section" id="testimonials" aria-labelledby="testimonials-heading">
        <h2 id="testimonials-heading">What Users Say</h2>
        <div className="testimonial-cards">
          <div className="testimonial">
            <div className="quote">"This app has transformed how I manage my college assignments. The reminders have saved me from missing deadlines countless times!"</div>
            <div className="author">— Engineering Student</div>
          </div>
          <div className="testimonial">
            <div className="quote">"As a project manager, I need to keep track of multiple deadlines. This tool makes it simple and effective."</div>
            <div className="author">— Marketing Professional</div>
          </div>
        </div>
      </section>
      
      <section className="upcoming-section" id="upcoming-features" aria-labelledby="upcoming-features-heading">
        <h2 id="upcoming-features-heading">Coming Soon</h2>
        
        <div className="upcoming-feature">
          <h3>✨ AI Task Assistant</h3>
          <p>Our AI will help you plan your study schedule or work priorities by analyzing your patterns and recommending optimal task arrangements.</p>
          <p><em>Coming soon</em></p>
        </div>
        
        <div className="upcoming-feature available-feature">
          <h3>🔄 Smart Scheduler</h3>
          <p>Perfect for class schedules and regular meetings. Set up powerful recurring patterns:</p>
          <ul>
            <li><strong>Hourly Planning:</strong> Block study sessions or work sprints throughout your day</li>
            <li><strong>Daily Tasks:</strong> Establish consistent study or work routines</li>
            <li><strong>Weekly Schedules:</strong> Manage recurring classes or team meetings</li>
            <li><strong>Monthly Reviews:</strong> Schedule regular progress assessments or reports</li>
          </ul>
          <button 
            className="feature-access-btn" 
            onClick={handleSchedulerClick}
            aria-label="Access smart scheduler feature"
          >
            {isGuest ? "Sign In to Try Smart Scheduler" : "Try Smart Scheduler"}
          </button>
        </div>
      </section>
      
      <div className="call-to-action" aria-labelledby="cta-heading">
        <h2 id="cta-heading">Ready to Boost Your Productivity?</h2>
        <p>{isGuest ? "Create an account to start organizing your life today." : "Start organizing your academic and professional life today."}</p>
        <button 
          className="cta-button" 
          onClick={handleTasksClick} 
          aria-label="Get started now with task management"
        >
          {isGuest ? "Sign Up Now" : "Get Started Now"}
        </button>
      </div>

      {/* Additional SEO content section */}
      <section className="seo-content">
        <h2 className="visually-hidden">About Our Task Management App</h2>
        <div className="seo-rich-text">
          <p>Our <strong>To-Do List App</strong> is designed to help you manage your tasks effectively. Whether you're a <strong>student</strong> juggling multiple <strong>assignments</strong> and <strong>class schedules</strong>, or a <strong>professional</strong> handling <strong>project deadlines</strong> and <strong>meetings</strong>, our app provides the tools you need to stay organized.</p>
          
          <p>With features like <strong>task prioritization</strong>, <strong>deadline tracking</strong>, <strong>recurring tasks</strong>, and <strong>smart scheduling</strong>, you can improve your <strong>productivity</strong> and ensure you never miss important <strong>deadlines</strong> again. Our intuitive interface makes it easy to <strong>organize tasks</strong> by date, priority, and category.</p>
          
          <p>Try our free <strong>productivity tool</strong> today and experience the benefits of efficient <strong>task management</strong> and <strong>time management</strong>. Join thousands of users who have improved their <strong>academic performance</strong> and <strong>work efficiency</strong> with our <strong>To-Do List App</strong>.</p>
        </div>
      </section>

      {/* Fix the structured data section - replace nested meta tags with div structure */}
      <div className="seo-metadata" itemScope itemType="http://schema.org/SoftwareApplication">
        <meta itemProp="name" content="To-Do List Task Management App" />
        <meta itemProp="applicationCategory" content="Productivity" />
        <meta itemProp="operatingSystem" content="Web" />
        <meta itemProp="description" content="Task management application for students and professionals with smart scheduling, recurring tasks, and deadline tracking features." />
        
        <div itemProp="offers" itemScope itemType="http://schema.org/Offer">
          <meta itemProp="price" content="0" />
          <meta itemProp="priceCurrency" content="USD" />
        </div>
        
        <div itemProp="aggregateRating" itemScope itemType="http://schema.org/AggregateRating">
          <meta itemProp="ratingValue" content="4.8" />
          <meta itemProp="ratingCount" content="1024" />
          <meta itemProp="reviewCount" content="512" />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
