-- A/B Testing System Database Schema
-- This schema supports comprehensive platform-wide A/B testing

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE A/B TESTING TABLES
-- =============================================

-- Experiments table - stores all A/B test configurations
CREATE TABLE ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    feature VARCHAR(100) NOT NULL, -- watermark, pricing, ui, ai_assistant, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, running, paused, completed, cancelled

    -- Experiment configuration
    traffic_allocation INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    target_audience JSONB, -- user tiers, countries, demographics

    -- Timing
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    duration_days INTEGER,

    -- Goals and metrics
    primary_metric VARCHAR(100) NOT NULL,
    secondary_metrics TEXT[], -- array of metric names
    conversion_goal VARCHAR(100) NOT NULL,
    minimum_sample_size INTEGER NOT NULL DEFAULT 1000,
    minimum_effect DECIMAL(5,2) NOT NULL DEFAULT 10.0, -- minimum detectable effect %
    confidence_level DECIMAL(5,2) NOT NULL DEFAULT 95.0,

    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    CONSTRAINT valid_feature CHECK (feature IN (
        'watermark', 'pricing', 'onboarding', 'ui', 'messaging', 'ai_assistant',
        'editor', 'collaboration', 'export', 'themes', 'analytics', 'notifications',
        'search', 'templates', 'publishing'
    )),
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date < end_date)
);

-- Variants table - stores different versions being tested
CREATE TABLE ab_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_control BOOLEAN NOT NULL DEFAULT FALSE,
    traffic_split INTEGER NOT NULL CHECK (traffic_split >= 0 AND traffic_split <= 100),
    config JSONB NOT NULL, -- variant-specific configuration

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure only one control per experiment
    UNIQUE(experiment_id, is_control) WHERE is_control = TRUE
);

-- User assignments - tracks which users are assigned to which variants
CREATE TABLE ab_user_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

    -- Assignment details
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10,2) DEFAULT 0,

    -- Context when assigned
    user_tier VARCHAR(50),
    user_agent TEXT,
    country VARCHAR(3), -- ISO country code
    referral_source VARCHAR(255),
    assignment_context JSONB, -- additional context data

    -- Ensure one assignment per user per experiment
    UNIQUE(user_id, experiment_id)
);

-- Conversion events - detailed tracking of user actions and conversions
CREATE TABLE ab_conversion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Performance indexes
    INDEX idx_conversion_events_user_experiment (user_id, experiment_id),
    INDEX idx_conversion_events_experiment_event (experiment_id, event_type),
    INDEX idx_conversion_events_occurred_at (occurred_at)
);

-- Experiment results - statistical analysis and results
CREATE TABLE ab_experiment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,

    -- Statistical results
    status VARCHAR(50) NOT NULL, -- insufficient_data, no_significant_difference, significant_winner, significant_loser
    winning_variant_id UUID REFERENCES ab_variants(id),
    confidence DECIMAL(5,2) NOT NULL,
    p_value DECIMAL(10,8) NOT NULL,
    effect DECIMAL(8,4) NOT NULL, -- percentage improvement

    -- Power analysis
    statistical_power DECIMAL(5,2),
    actual_sample_size INTEGER,

    -- Calculation metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_method VARCHAR(100), -- chi_square, t_test, bayesian, etc.

    CONSTRAINT valid_result_status CHECK (status IN (
        'insufficient_data', 'no_significant_difference', 'significant_winner', 'significant_loser'
    ))
);

-- Variant results - detailed results for each variant
CREATE TABLE ab_variant_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_result_id UUID NOT NULL REFERENCES ab_experiment_results(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

    -- Core metrics
    participants INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(8,4) NOT NULL DEFAULT 0,

    -- Statistical measures
    confidence_interval_lower DECIMAL(8,4),
    confidence_interval_upper DECIMAL(8,4),
    standard_error DECIMAL(8,4),

    -- Secondary metrics (stored as JSON for flexibility)
    secondary_metrics JSONB,

    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,

    UNIQUE(experiment_result_id, variant_id)
);

-- Daily results for trend analysis
CREATE TABLE ab_daily_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Daily metrics
    participants INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,

    -- Additional daily metrics
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    session_duration DECIMAL(10,2) DEFAULT 0,

    UNIQUE(experiment_id, variant_id, date)
);

-- =============================================
-- PLATFORM-SPECIFIC FEATURE TABLES
-- =============================================

-- Feature flags with A/B testing integration
CREATE TABLE ab_feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    feature_type VARCHAR(100) NOT NULL,

    -- Default configuration
    default_config JSONB,

    -- A/B testing integration
    has_active_experiment BOOLEAN DEFAULT FALSE,
    active_experiment_id UUID REFERENCES ab_experiments(id),

    -- Feature management
    is_enabled BOOLEAN DEFAULT TRUE,
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform configuration overrides for A/B testing
CREATE TABLE ab_platform_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

    -- Configuration details
    config_type VARCHAR(100) NOT NULL, -- ui, pricing, features, etc.
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(experiment_id, variant_id, config_type, config_key)
);

-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Core performance indexes
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_experiments_feature ON ab_experiments(feature);
CREATE INDEX idx_ab_experiments_dates ON ab_experiments(start_date, end_date);
CREATE INDEX idx_ab_experiments_created_by ON ab_experiments(created_by);

CREATE INDEX idx_ab_variants_experiment ON ab_variants(experiment_id);
CREATE INDEX idx_ab_variants_control ON ab_variants(is_control);

CREATE INDEX idx_ab_user_assignments_user ON ab_user_assignments(user_id);
CREATE INDEX idx_ab_user_assignments_experiment ON ab_user_assignments(experiment_id);
CREATE INDEX idx_ab_user_assignments_variant ON ab_user_assignments(variant_id);
CREATE INDEX idx_ab_user_assignments_converted ON ab_user_assignments(converted);
CREATE INDEX idx_ab_user_assignments_assigned_at ON ab_user_assignments(assigned_at);

CREATE INDEX idx_ab_conversion_events_user ON ab_conversion_events(user_id);
CREATE INDEX idx_ab_conversion_events_experiment ON ab_conversion_events(experiment_id);
CREATE INDEX idx_ab_conversion_events_event_type ON ab_conversion_events(event_type);

CREATE INDEX idx_ab_daily_results_experiment_date ON ab_daily_results(experiment_id, date);
CREATE INDEX idx_ab_daily_results_variant_date ON ab_daily_results(variant_id, date);

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to assign user to experiment variant
CREATE OR REPLACE FUNCTION assign_user_to_experiment(
    p_user_id UUID,
    p_experiment_id UUID,
    p_user_tier VARCHAR DEFAULT 'free',
    p_user_agent TEXT DEFAULT '',
    p_country VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_variant_id UUID;
    v_assignment_id UUID;
    v_experiment ab_experiments%ROWTYPE;
    v_total_traffic INTEGER;
    v_random_value INTEGER;
    v_cumulative_traffic INTEGER := 0;
    variant_record RECORD;
BEGIN
    -- Get experiment details
    SELECT * INTO v_experiment FROM ab_experiments WHERE id = p_experiment_id AND status = 'running';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Experiment not found or not running: %', p_experiment_id;
    END IF;

    -- Check if user already assigned
    SELECT variant_id INTO v_variant_id
    FROM ab_user_assignments
    WHERE user_id = p_user_id AND experiment_id = p_experiment_id;

    IF FOUND THEN
        RETURN v_variant_id;
    END IF;

    -- Check if user meets target audience criteria
    -- (Simplified - in real implementation, check against v_experiment.target_audience JSONB)

    -- Generate random number for traffic allocation
    v_random_value := floor(random() * 100) + 1;

    -- Check overall traffic allocation
    IF v_random_value > v_experiment.traffic_allocation THEN
        RETURN NULL; -- User not included in experiment
    END IF;

    -- Assign to variant based on traffic split
    v_random_value := floor(random() * 100) + 1;

    FOR variant_record IN
        SELECT id, traffic_split
        FROM ab_variants
        WHERE experiment_id = p_experiment_id
        ORDER BY created_at
    LOOP
        v_cumulative_traffic := v_cumulative_traffic + variant_record.traffic_split;
        IF v_random_value <= v_cumulative_traffic THEN
            v_variant_id := variant_record.id;
            EXIT;
        END IF;
    END LOOP;

    -- Create assignment record
    INSERT INTO ab_user_assignments (
        user_id, experiment_id, variant_id, user_tier, user_agent, country
    ) VALUES (
        p_user_id, p_experiment_id, v_variant_id, p_user_tier, p_user_agent, p_country
    ) RETURNING id INTO v_assignment_id;

    RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track conversion event
CREATE OR REPLACE FUNCTION track_conversion_event(
    p_user_id UUID,
    p_experiment_id UUID,
    p_event_type VARCHAR,
    p_event_data JSONB DEFAULT '{}',
    p_conversion_value DECIMAL DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    v_variant_id UUID;
    v_assignment_record ab_user_assignments%ROWTYPE;
BEGIN
    -- Get user's variant assignment
    SELECT * INTO v_assignment_record
    FROM ab_user_assignments
    WHERE user_id = p_user_id AND experiment_id = p_experiment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not assigned to experiment: % %', p_user_id, p_experiment_id;
    END IF;

    -- Insert conversion event
    INSERT INTO ab_conversion_events (
        user_id, experiment_id, variant_id, event_type, event_data, conversion_value
    ) VALUES (
        p_user_id, p_experiment_id, v_assignment_record.variant_id, p_event_type, p_event_data, p_conversion_value
    );

    -- Update assignment record if this is a conversion
    IF p_event_type IN ('upgrade_to_premium', 'upgrade_to_enterprise', 'subscription_renewal') THEN
        UPDATE ab_user_assignments
        SET
            converted = TRUE,
            converted_at = NOW(),
            conversion_value = conversion_value + p_conversion_value,
            last_seen = NOW()
        WHERE user_id = p_user_id AND experiment_id = p_experiment_id;
    ELSE
        -- Update last seen
        UPDATE ab_user_assignments
        SET last_seen = NOW()
        WHERE user_id = p_user_id AND experiment_id = p_experiment_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate experiment results
CREATE OR REPLACE FUNCTION calculate_experiment_results(p_experiment_id UUID)
RETURNS TABLE(
    variant_id UUID,
    variant_name VARCHAR,
    participants BIGINT,
    conversions BIGINT,
    conversion_rate DECIMAL,
    confidence_lower DECIMAL,
    confidence_upper DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id as variant_id,
        v.name as variant_name,
        COUNT(ua.id) as participants,
        COUNT(ua.id) FILTER (WHERE ua.converted = TRUE) as conversions,
        ROUND(
            (COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) * 100,
            4
        ) as conversion_rate,
        -- Simplified confidence interval (Wilson score interval would be more accurate)
        GREATEST(0, ROUND(
            (COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) * 100 -
            1.96 * SQRT((COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) *
                       (1 - COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) /
                       NULLIF(COUNT(ua.id), 0)) * 100, 4
        )) as confidence_lower,
        LEAST(100, ROUND(
            (COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) * 100 +
            1.96 * SQRT((COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) *
                       (1 - COUNT(ua.id) FILTER (WHERE ua.converted = TRUE)::DECIMAL / NULLIF(COUNT(ua.id), 0)) /
                       NULLIF(COUNT(ua.id), 0)) * 100, 4
        )) as confidence_upper
    FROM ab_variants v
    LEFT JOIN ab_user_assignments ua ON v.id = ua.variant_id
    WHERE v.experiment_id = p_experiment_id
    GROUP BY v.id, v.name
    ORDER BY v.created_at;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active experiments view
CREATE VIEW active_experiments AS
SELECT
    e.*,
    COUNT(DISTINCT ua.user_id) as total_participants,
    COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.converted = TRUE) as total_conversions,
    ROUND(
        (COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.converted = TRUE)::DECIMAL /
         NULLIF(COUNT(DISTINCT ua.user_id), 0)) * 100, 2
    ) as overall_conversion_rate
FROM ab_experiments e
LEFT JOIN ab_user_assignments ua ON e.id = ua.experiment_id
WHERE e.status = 'running'
GROUP BY e.id;

-- User experiment assignments view
CREATE VIEW user_experiment_assignments AS
SELECT
    ua.user_id,
    e.name as experiment_name,
    e.feature,
    v.name as variant_name,
    v.is_control,
    ua.assigned_at,
    ua.converted,
    ua.conversion_value
FROM ab_user_assignments ua
JOIN ab_experiments e ON ua.experiment_id = e.id
JOIN ab_variants v ON ua.variant_id = v.id;

-- Experiment performance summary view
CREATE VIEW experiment_performance AS
SELECT
    e.id as experiment_id,
    e.name as experiment_name,
    e.feature,
    e.status,
    v.id as variant_id,
    v.name as variant_name,
    v.is_control,
    COUNT(ua.user_id) as participants,
    COUNT(ua.user_id) FILTER (WHERE ua.converted = TRUE) as conversions,
    ROUND(
        (COUNT(ua.user_id) FILTER (WHERE ua.converted = TRUE)::DECIMAL /
         NULLIF(COUNT(ua.user_id), 0)) * 100, 4
    ) as conversion_rate,
    SUM(ua.conversion_value) as total_revenue,
    AVG(ua.conversion_value) FILTER (WHERE ua.converted = TRUE) as avg_order_value
FROM ab_experiments e
JOIN ab_variants v ON e.id = v.experiment_id
LEFT JOIN ab_user_assignments ua ON v.id = ua.variant_id
GROUP BY e.id, e.name, e.feature, e.status, v.id, v.name, v.is_control
ORDER BY e.created_at DESC, v.created_at;

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample experiment data
-- This would typically be handled by your application, but included for completeness

-- Sample experiment: Watermark messaging test
INSERT INTO ab_experiments (
    id, name, description, hypothesis, feature, status, traffic_allocation,
    target_audience, start_date, duration_days, primary_metric, secondary_metrics,
    conversion_goal, minimum_sample_size, minimum_effect, confidence_level, created_by
) VALUES (
    uuid_generate_v4(),
    'Watermark Message A/B Test',
    'Testing different watermark messages to optimize conversion rates',
    'More compelling watermark messaging will increase premium upgrades',
    'watermark',
    'running',
    50,
    '{"userTiers": ["free"], "newUsersOnly": false}',
    NOW() - INTERVAL '7 days',
    14,
    'conversion_rate',
    ARRAY['document_exports', 'time_to_conversion', 'user_engagement'],
    'upgrade_to_premium',
    1000,
    10.0,
    95.0,
    uuid_generate_v4()
);

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ab_testing_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ab_testing_user;