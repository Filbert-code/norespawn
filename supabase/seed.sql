-- ============================================================================
-- NoRespawn — seed data
-- ----------------------------------------------------------------------------
-- Populates the reference/taxonomy lookups and a starter exercise catalog.
-- This file inserts NO user-owned data (workouts, sessions, scores) and NO
-- exercise_candidate rows. The `embedding` column is left NULL here and is
-- backfilled by a separate one-time "embed catalog" script after seeding.
--
-- Safe to re-run: every insert uses ON CONFLICT DO NOTHING.
-- Run order assumes the schema migrations (tables + enum types) already exist.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. body_group  (top-level muscle regions)
-- ----------------------------------------------------------------------------
insert into body_group (slug, label, sort_order) values
  ('shoulders', 'Shoulders', 1),
  ('chest',     'Chest',     2),
  ('back',      'Back',      3),
  ('arms',      'Arms',      4),
  ('legs',      'Legs',      5),
  ('glutes',    'Glutes',    6),
  ('core',      'Core',      7),
  ('cardio',    'Cardio',    8),
  ('full_body', 'Full Body', 9)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. body_sub_group  (finer regions, each belongs to one body_group)
-- ----------------------------------------------------------------------------
insert into body_sub_group (slug, body_group_slug, label, sort_order) values
  ('front_delts',  'shoulders', 'Front Delts',  1),
  ('side_delts',   'shoulders', 'Side Delts',   2),
  ('rear_delts',   'shoulders', 'Rear Delts',   3),
  ('upper_chest',  'chest',     'Upper Chest',  1),
  ('mid_chest',    'chest',     'Mid Chest',    2),
  ('lower_chest',  'chest',     'Lower Chest',  3),
  ('lats',         'back',      'Lats',         1),
  ('upper_back',   'back',      'Upper Back',   2),
  ('traps',        'back',      'Traps',        3),
  ('lower_back',   'back',      'Lower Back',   4),
  ('biceps',       'arms',      'Biceps',       1),
  ('triceps',      'arms',      'Triceps',      2),
  ('forearms',     'arms',      'Forearms',     3),
  ('quads',        'legs',      'Quads',        1),
  ('hamstrings',   'legs',      'Hamstrings',   2),
  ('calves',       'legs',      'Calves',       3),
  ('adductors',    'legs',      'Adductors',    4),
  ('glutes',       'glutes',    'Glutes',       1),
  ('abs',          'core',      'Abs',          1),
  ('obliques',     'core',      'Obliques',     2)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 3. equipment
-- ----------------------------------------------------------------------------
insert into equipment (slug, label, sort_order) values
  ('barbell',       'Barbell',       1),
  ('dumbbell',      'Dumbbell',      2),
  ('machine',       'Machine',       3),
  ('cable',         'Cable',         4),
  ('smith_machine', 'Smith Machine', 5),
  ('kettlebell',    'Kettlebell',    6),
  ('bodyweight',    'Bodyweight',    7),
  ('band',          'Resistance Band', 8)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 4. exercise  (starter catalog — 143 common movements)
--    Columns:
--    slug, name, name_normalized, tracking_type, body_group_slug,
--    body_sub_group_slug, equipment_slug, movement_pattern, mechanic,
--    force_type, laterality, default_sets, default_reps, default_weight_lbs,
--    weight_increment_lbs, default_duration_seconds, default_set_rest_seconds,
--    default_end_rest_seconds, source, is_verified
-- ----------------------------------------------------------------------------
insert into exercise (
  slug, name, name_normalized, tracking_type, body_group_slug,
  body_sub_group_slug, equipment_slug, movement_pattern, mechanic,
  force_type, laterality, default_sets, default_reps, default_weight_lbs,
  weight_increment_lbs, default_duration_seconds, default_set_rest_seconds,
  default_end_rest_seconds, source, is_verified
) values
-- Chest
('barbell_bench_press','Barbell Bench Press','barbell bench press','weight_reps','chest','mid_chest','barbell','horizontal_push','compound','push','bilateral',4,8,135,5,NULL,90,120,'seed',true),
('incline_barbell_bench_press','Incline Barbell Bench Press','incline barbell bench press','weight_reps','chest','upper_chest','barbell','horizontal_push','compound','push','bilateral',4,8,115,5,NULL,90,120,'seed',true),
('decline_barbell_bench_press','Decline Barbell Bench Press','decline barbell bench press','weight_reps','chest','lower_chest','barbell','horizontal_push','compound','push','bilateral',4,8,135,5,NULL,90,120,'seed',true),
('dumbbell_bench_press','Dumbbell Bench Press','dumbbell bench press','weight_reps','chest','mid_chest','dumbbell','horizontal_push','compound','push','bilateral',4,10,50,5,NULL,90,120,'seed',true),
('incline_dumbbell_press','Incline Dumbbell Press','incline dumbbell press','weight_reps','chest','upper_chest','dumbbell','horizontal_push','compound','push','bilateral',4,10,45,5,NULL,90,120,'seed',true),
('decline_dumbbell_press','Decline Dumbbell Press','decline dumbbell press','weight_reps','chest','lower_chest','dumbbell','horizontal_push','compound','push','bilateral',4,10,50,5,NULL,90,120,'seed',true),
('machine_chest_press','Machine Chest Press','machine chest press','weight_reps','chest','mid_chest','machine','horizontal_push','compound','push','bilateral',4,10,90,10,NULL,75,120,'seed',true),
('incline_machine_chest_press','Incline Machine Chest Press','incline machine chest press','weight_reps','chest','upper_chest','machine','horizontal_push','compound','push','bilateral',4,10,80,10,NULL,75,120,'seed',true),
('smith_machine_bench_press','Smith Machine Bench Press','smith machine bench press','weight_reps','chest','mid_chest','smith_machine','horizontal_push','compound','push','bilateral',4,8,115,5,NULL,90,120,'seed',true),
('incline_smith_machine_bench_press','Incline Smith Machine Bench Press','incline smith machine bench press','weight_reps','chest','upper_chest','smith_machine','horizontal_push','compound','push','bilateral',4,8,95,5,NULL,90,120,'seed',true),
('push_up','Push Up','push up','bodyweight_reps','chest','mid_chest','bodyweight','horizontal_push','compound','push','bilateral',3,15,NULL,NULL,NULL,60,120,'seed',true),
('chest_dip','Chest Dip','chest dip','bodyweight_reps','chest','lower_chest','bodyweight','horizontal_push','compound','push','bilateral',3,12,NULL,NULL,NULL,75,120,'seed',true),
('cable_crossover','Cable Crossover','cable crossover','weight_reps','chest','mid_chest','cable','isolation','isolation','push','bilateral',3,12,30,5,NULL,45,120,'seed',true),
('low_cable_crossover','Low Cable Crossover','low cable crossover','weight_reps','chest','upper_chest','cable','isolation','isolation','push','bilateral',3,12,25,5,NULL,45,120,'seed',true),
('high_cable_crossover','High Cable Crossover','high cable crossover','weight_reps','chest','lower_chest','cable','isolation','isolation','push','bilateral',3,12,30,5,NULL,45,120,'seed',true),
('pec_deck','Pec Deck','pec deck','weight_reps','chest','mid_chest','machine','isolation','isolation','push','bilateral',3,12,80,10,NULL,45,120,'seed',true),
('dumbbell_fly','Dumbbell Fly','dumbbell fly','weight_reps','chest','mid_chest','dumbbell','isolation','isolation','push','bilateral',3,12,25,5,NULL,45,120,'seed',true),
('incline_dumbbell_fly','Incline Dumbbell Fly','incline dumbbell fly','weight_reps','chest','upper_chest','dumbbell','isolation','isolation','push','bilateral',3,12,20,5,NULL,45,120,'seed',true),
-- Shoulders
('barbell_overhead_press','Barbell Overhead Press','barbell overhead press','weight_reps','shoulders','front_delts','barbell','vertical_push','compound','push','bilateral',4,8,75,5,NULL,90,120,'seed',true),
('dumbbell_shoulder_press','Dumbbell Shoulder Press','dumbbell shoulder press','weight_reps','shoulders','front_delts','dumbbell','vertical_push','compound','push','bilateral',4,10,40,5,NULL,75,120,'seed',true),
('arnold_press','Arnold Press','arnold press','weight_reps','shoulders','front_delts','dumbbell','vertical_push','compound','push','bilateral',3,10,35,5,NULL,75,120,'seed',true),
('machine_shoulder_press','Machine Shoulder Press','machine shoulder press','weight_reps','shoulders','front_delts','machine','vertical_push','compound','push','bilateral',4,10,70,10,NULL,75,120,'seed',true),
('smith_machine_shoulder_press','Smith Machine Shoulder Press','smith machine shoulder press','weight_reps','shoulders','front_delts','smith_machine','vertical_push','compound','push','bilateral',4,8,65,5,NULL,90,120,'seed',true),
('dumbbell_lateral_raise','Dumbbell Lateral Raise','dumbbell lateral raise','weight_reps','shoulders','side_delts','dumbbell','isolation','isolation','push','bilateral',3,12,15,5,NULL,45,120,'seed',true),
('cable_lateral_raise','Cable Lateral Raise','cable lateral raise','weight_reps','shoulders','side_delts','cable','isolation','isolation','push','unilateral',3,12,10,5,NULL,45,120,'seed',true),
('machine_lateral_raise','Machine Lateral Raise','machine lateral raise','weight_reps','shoulders','side_delts','machine','isolation','isolation','push','bilateral',3,12,50,10,NULL,45,120,'seed',true),
('dumbbell_front_raise','Dumbbell Front Raise','dumbbell front raise','weight_reps','shoulders','front_delts','dumbbell','isolation','isolation','push','bilateral',3,12,15,5,NULL,45,120,'seed',true),
('cable_front_raise','Cable Front Raise','cable front raise','weight_reps','shoulders','front_delts','cable','isolation','isolation','push','bilateral',3,12,25,5,NULL,45,120,'seed',true),
('barbell_front_raise','Barbell Front Raise','barbell front raise','weight_reps','shoulders','front_delts','barbell','isolation','isolation','push','bilateral',3,12,30,5,NULL,45,120,'seed',true),
('dumbbell_rear_delt_fly','Dumbbell Rear Delt Fly','dumbbell rear delt fly','weight_reps','shoulders','rear_delts','dumbbell','isolation','isolation','pull','bilateral',3,12,15,5,NULL,45,120,'seed',true),
('cable_rear_delt_fly','Cable Rear Delt Fly','cable rear delt fly','weight_reps','shoulders','rear_delts','cable','isolation','isolation','pull','unilateral',3,12,10,5,NULL,45,120,'seed',true),
('reverse_pec_deck','Reverse Pec Deck','reverse pec deck','weight_reps','shoulders','rear_delts','machine','isolation','isolation','pull','bilateral',3,12,60,10,NULL,45,120,'seed',true),
('face_pull','Face Pull','face pull','weight_reps','shoulders','rear_delts','cable','isolation','isolation','pull','bilateral',3,15,40,5,NULL,45,120,'seed',true),
('barbell_upright_row','Barbell Upright Row','barbell upright row','weight_reps','shoulders','side_delts','barbell','vertical_pull','compound','pull','bilateral',3,10,65,5,NULL,60,120,'seed',true),
('cable_upright_row','Cable Upright Row','cable upright row','weight_reps','shoulders','side_delts','cable','vertical_pull','compound','pull','bilateral',3,12,50,5,NULL,60,120,'seed',true),
('dumbbell_upright_row','Dumbbell Upright Row','dumbbell upright row','weight_reps','shoulders','side_delts','dumbbell','vertical_pull','compound','pull','bilateral',3,12,25,5,NULL,60,120,'seed',true),
-- Back
('deadlift','Deadlift','deadlift','weight_reps','back','lower_back','barbell','hinge','compound','pull','bilateral',4,6,225,5,NULL,90,120,'seed',true),
('barbell_row','Barbell Row','barbell row','weight_reps','back','upper_back','barbell','horizontal_pull','compound','pull','bilateral',4,8,135,5,NULL,90,120,'seed',true),
('dumbbell_row','Dumbbell Row','dumbbell row','weight_reps','back','lats','dumbbell','horizontal_pull','compound','pull','unilateral',4,10,55,5,NULL,75,120,'seed',true),
('seated_cable_row','Seated Cable Row','seated cable row','weight_reps','back','upper_back','cable','horizontal_pull','compound','pull','bilateral',4,10,120,5,NULL,75,120,'seed',true),
('t_bar_row','T Bar Row','t bar row','weight_reps','back','upper_back','machine','horizontal_pull','compound','pull','bilateral',4,8,90,10,NULL,75,120,'seed',true),
('smith_machine_row','Smith Machine Row','smith machine row','weight_reps','back','upper_back','smith_machine','horizontal_pull','compound','pull','bilateral',4,8,135,5,NULL,75,120,'seed',true),
('inverted_row','Inverted Row','inverted row','bodyweight_reps','back','upper_back','bodyweight','horizontal_pull','compound','pull','bilateral',3,10,NULL,NULL,NULL,75,120,'seed',true),
('lat_pulldown','Lat Pulldown','lat pulldown','weight_reps','back','lats','cable','vertical_pull','compound','pull','bilateral',4,10,120,5,NULL,75,120,'seed',true),
('pull_up','Pull Up','pull up','bodyweight_reps','back','lats','bodyweight','vertical_pull','compound','pull','bilateral',3,8,NULL,NULL,NULL,90,120,'seed',true),
('chin_up','Chin Up','chin up','bodyweight_reps','back','lats','bodyweight','vertical_pull','compound','pull','bilateral',3,8,NULL,NULL,NULL,90,120,'seed',true),
('straight_arm_pulldown','Straight Arm Pulldown','straight arm pulldown','weight_reps','back','lats','cable','isolation','isolation','pull','bilateral',3,12,60,5,NULL,60,120,'seed',true),
('dumbbell_pullover','Dumbbell Pullover','dumbbell pullover','weight_reps','back','lats','dumbbell','isolation','isolation','pull','bilateral',3,12,40,5,NULL,60,120,'seed',true),
('machine_pullover','Machine Pullover','machine pullover','weight_reps','back','lats','machine','isolation','isolation','pull','bilateral',3,12,90,10,NULL,60,120,'seed',true),
('barbell_shrug','Barbell Shrug','barbell shrug','weight_reps','back','traps','barbell','isolation','isolation','pull','bilateral',4,12,185,5,NULL,60,120,'seed',true),
('dumbbell_shrug','Dumbbell Shrug','dumbbell shrug','weight_reps','back','traps','dumbbell','isolation','isolation','pull','bilateral',4,12,70,5,NULL,60,120,'seed',true),
('cable_shrug','Cable Shrug','cable shrug','weight_reps','back','traps','cable','isolation','isolation','pull','bilateral',3,12,120,5,NULL,60,120,'seed',true),
('back_extension','Back Extension','back extension','bodyweight_reps','back','lower_back','bodyweight','hinge','compound','pull','bilateral',3,12,NULL,NULL,NULL,60,120,'seed',true),
-- Arms — biceps
('barbell_bicep_curl','Barbell Bicep Curl','barbell bicep curl','weight_reps','arms','biceps','barbell','isolation','isolation','pull','bilateral',3,10,65,5,NULL,45,120,'seed',true),
('dumbbell_bicep_curl','Dumbbell Bicep Curl','dumbbell bicep curl','weight_reps','arms','biceps','dumbbell','isolation','isolation','pull','bilateral',3,12,30,5,NULL,45,120,'seed',true),
('ez_bar_curl','EZ Bar Curl','ez bar curl','weight_reps','arms','biceps','barbell','isolation','isolation','pull','bilateral',3,10,55,5,NULL,45,120,'seed',true),
('hammer_curl','Hammer Curl','hammer curl','weight_reps','arms','biceps','dumbbell','isolation','isolation','pull','bilateral',3,12,30,5,NULL,45,120,'seed',true),
('preacher_curl','Preacher Curl','preacher curl','weight_reps','arms','biceps','machine','isolation','isolation','pull','bilateral',3,10,70,10,NULL,45,120,'seed',true),
('cable_curl','Cable Curl','cable curl','weight_reps','arms','biceps','cable','isolation','isolation','pull','bilateral',3,12,50,5,NULL,45,120,'seed',true),
('incline_dumbbell_curl','Incline Dumbbell Curl','incline dumbbell curl','weight_reps','arms','biceps','dumbbell','isolation','isolation','pull','bilateral',3,12,25,5,NULL,45,120,'seed',true),
('concentration_curl','Concentration Curl','concentration curl','weight_reps','arms','biceps','dumbbell','isolation','isolation','pull','unilateral',3,12,25,5,NULL,45,120,'seed',true),
-- Arms — triceps
('close_grip_bench_press','Close Grip Bench Press','close grip bench press','weight_reps','arms','triceps','barbell','horizontal_push','compound','push','bilateral',4,8,135,5,NULL,90,120,'seed',true),
('triceps_dip','Triceps Dip','triceps dip','bodyweight_reps','arms','triceps','bodyweight','vertical_push','compound','push','bilateral',3,10,NULL,NULL,NULL,90,120,'seed',true),
('diamond_push_up','Diamond Push Up','diamond push up','bodyweight_reps','arms','triceps','bodyweight','horizontal_push','compound','push','bilateral',3,12,NULL,NULL,NULL,60,120,'seed',true),
('overhead_dumbbell_tricep_extension','Overhead Dumbbell Tricep Extension','overhead dumbbell tricep extension','weight_reps','arms','triceps','dumbbell','isolation','isolation','push','bilateral',3,12,40,5,NULL,45,120,'seed',true),
('rope_pushdown','Rope Pushdown','rope pushdown','weight_reps','arms','triceps','cable','isolation','isolation','push','bilateral',3,12,50,5,NULL,45,120,'seed',true),
('overhead_cable_tricep_extension','Overhead Cable Tricep Extension','overhead cable tricep extension','weight_reps','arms','triceps','cable','isolation','isolation','push','bilateral',3,12,45,5,NULL,45,120,'seed',true),
('skullcrusher','Skullcrusher','skullcrusher','weight_reps','arms','triceps','barbell','isolation','isolation','push','bilateral',3,10,65,5,NULL,45,120,'seed',true),
('tricep_kickback','Tricep Kickback','tricep kickback','weight_reps','arms','triceps','dumbbell','isolation','isolation','push','bilateral',3,12,20,5,NULL,45,120,'seed',true),
('machine_tricep_extension','Machine Tricep Extension','machine tricep extension','weight_reps','arms','triceps','machine','isolation','isolation','push','bilateral',3,12,90,10,NULL,45,120,'seed',true),
-- Arms — forearms
('barbell_wrist_curl','Barbell Wrist Curl','barbell wrist curl','weight_reps','arms','forearms','barbell','isolation','isolation','pull','bilateral',3,15,45,5,NULL,45,120,'seed',true),
('dumbbell_wrist_curl','Dumbbell Wrist Curl','dumbbell wrist curl','weight_reps','arms','forearms','dumbbell','isolation','isolation','pull','bilateral',3,15,20,5,NULL,45,120,'seed',true),
('cable_wrist_curl','Cable Wrist Curl','cable wrist curl','weight_reps','arms','forearms','cable','isolation','isolation','pull','bilateral',3,15,40,5,NULL,45,120,'seed',true),
('reverse_wrist_curl','Reverse Wrist Curl','reverse wrist curl','weight_reps','arms','forearms','barbell','isolation','isolation','push','bilateral',3,15,30,5,NULL,45,120,'seed',true),
('reverse_curl','Reverse Curl','reverse curl','weight_reps','arms','forearms','barbell','isolation','isolation','pull','bilateral',3,12,45,5,NULL,45,120,'seed',true),
('farmers_carry','Farmers Carry','farmers carry','weight_reps','arms','forearms','dumbbell','carry','compound','static','bilateral',3,10,60,5,NULL,75,120,'seed',true),
('suitcase_carry','Suitcase Carry','suitcase carry','weight_reps','arms','forearms','kettlebell','carry','compound','static','unilateral',3,10,55,5,NULL,75,120,'seed',true),
-- Legs
('barbell_back_squat','Barbell Back Squat','barbell back squat','weight_reps','legs','quads','barbell','squat','compound','push','bilateral',4,8,185,5,NULL,120,120,'seed',true),
('barbell_front_squat','Barbell Front Squat','barbell front squat','weight_reps','legs','quads','barbell','squat','compound','push','bilateral',4,8,135,5,NULL,120,120,'seed',true),
('goblet_squat','Goblet Squat','goblet squat','weight_reps','legs','quads','dumbbell','squat','compound','push','bilateral',3,12,50,5,NULL,90,120,'seed',true),
('dumbbell_squat','Dumbbell Squat','dumbbell squat','weight_reps','legs','quads','dumbbell','squat','compound','push','bilateral',3,12,40,5,NULL,90,120,'seed',true),
('hack_squat','Hack Squat','hack squat','weight_reps','legs','quads','machine','squat','compound','push','bilateral',4,10,180,10,NULL,120,120,'seed',true),
('leg_press','Leg Press','leg press','weight_reps','legs','quads','machine','squat','compound','push','bilateral',4,10,270,10,NULL,120,120,'seed',true),
('smith_machine_squat','Smith Machine Squat','smith machine squat','weight_reps','legs','quads','smith_machine','squat','compound','push','bilateral',4,8,135,5,NULL,120,120,'seed',true),
('bulgarian_split_squat','Bulgarian Split Squat','bulgarian split squat','weight_reps','legs','quads','dumbbell','lunge','compound','push','unilateral',3,10,35,5,NULL,90,120,'seed',true),
('walking_lunge','Walking Lunge','walking lunge','weight_reps','legs','quads','dumbbell','lunge','compound','push','alternating',3,12,30,5,NULL,90,120,'seed',true),
('reverse_lunge','Reverse Lunge','reverse lunge','weight_reps','legs','quads','dumbbell','lunge','compound','push','unilateral',3,10,30,5,NULL,90,120,'seed',true),
('dumbbell_step_up','Dumbbell Step Up','dumbbell step up','weight_reps','legs','quads','dumbbell','lunge','compound','push','unilateral',3,10,30,5,NULL,90,120,'seed',true),
('leg_extension','Leg Extension','leg extension','weight_reps','legs','quads','machine','isolation','isolation','push','bilateral',3,12,90,10,NULL,60,120,'seed',true),
('lying_leg_curl','Lying Leg Curl','lying leg curl','weight_reps','legs','hamstrings','machine','hinge','isolation','pull','bilateral',3,12,70,10,NULL,60,120,'seed',true),
('seated_leg_curl','Seated Leg Curl','seated leg curl','weight_reps','legs','hamstrings','machine','hinge','isolation','pull','bilateral',3,12,80,10,NULL,60,120,'seed',true),
('romanian_deadlift','Romanian Deadlift','romanian deadlift','weight_reps','legs','hamstrings','barbell','hinge','compound','pull','bilateral',4,8,155,5,NULL,120,120,'seed',true),
('stiff_leg_deadlift','Stiff Leg Deadlift','stiff leg deadlift','weight_reps','legs','hamstrings','barbell','hinge','compound','pull','bilateral',3,10,135,5,NULL,120,120,'seed',true),
('barbell_good_morning','Barbell Good Morning','barbell good morning','weight_reps','legs','hamstrings','barbell','hinge','compound','pull','bilateral',3,10,95,5,NULL,90,120,'seed',true),
('standing_calf_raise','Standing Calf Raise','standing calf raise','weight_reps','legs','calves','machine','isolation','isolation','push','bilateral',4,15,120,10,NULL,60,120,'seed',true),
('seated_calf_raise','Seated Calf Raise','seated calf raise','weight_reps','legs','calves','machine','isolation','isolation','push','bilateral',4,15,90,10,NULL,60,120,'seed',true),
('leg_press_calf_raise','Leg Press Calf Raise','leg press calf raise','weight_reps','legs','calves','machine','isolation','isolation','push','bilateral',4,15,180,10,NULL,60,120,'seed',true),
('dumbbell_calf_raise','Dumbbell Calf Raise','dumbbell calf raise','weight_reps','legs','calves','dumbbell','isolation','isolation','push','bilateral',3,15,45,5,NULL,60,120,'seed',true),
('hip_adduction_machine','Hip Adduction Machine','hip adduction machine','weight_reps','legs','adductors','machine','isolation','isolation','push','bilateral',3,12,90,10,NULL,60,120,'seed',true),
('sissy_squat','Sissy Squat','sissy squat','bodyweight_reps','legs','quads','bodyweight','squat','compound','push','bilateral',3,12,NULL,NULL,NULL,60,120,'seed',true),
('bodyweight_squat','Bodyweight Squat','bodyweight squat','bodyweight_reps','legs','quads','bodyweight','squat','compound','push','bilateral',3,20,NULL,NULL,NULL,60,120,'seed',true),
-- Glutes
('barbell_hip_thrust','Barbell Hip Thrust','barbell hip thrust','weight_reps','glutes','glutes','barbell','hinge','compound','push','bilateral',4,10,185,5,NULL,90,120,'seed',true),
('machine_hip_thrust','Machine Hip Thrust','machine hip thrust','weight_reps','glutes','glutes','machine','hinge','compound','push','bilateral',4,10,180,10,NULL,90,120,'seed',true),
('glute_bridge','Glute Bridge','glute bridge','bodyweight_reps','glutes','glutes','bodyweight','hinge','compound','push','bilateral',3,20,NULL,NULL,NULL,60,120,'seed',true),
('barbell_glute_bridge','Barbell Glute Bridge','barbell glute bridge','weight_reps','glutes','glutes','barbell','hinge','compound','push','bilateral',4,12,135,5,NULL,90,120,'seed',true),
('cable_glute_kickback','Cable Glute Kickback','cable glute kickback','weight_reps','glutes','glutes','cable','hinge','isolation','push','unilateral',3,15,25,5,NULL,60,120,'seed',true),
('hip_abduction_machine','Hip Abduction Machine','hip abduction machine','weight_reps','glutes','glutes','machine','isolation','isolation','push','bilateral',3,15,100,10,NULL,60,120,'seed',true),
('dumbbell_romanian_deadlift','Dumbbell Romanian Deadlift','dumbbell romanian deadlift','weight_reps','glutes','glutes','dumbbell','hinge','compound','pull','bilateral',3,10,50,5,NULL,90,120,'seed',true),
('cable_pull_through','Cable Pull Through','cable pull through','weight_reps','glutes','glutes','cable','hinge','compound','pull','bilateral',3,12,70,5,NULL,60,120,'seed',true),
('frog_pump','Frog Pump','frog pump','bodyweight_reps','glutes','glutes','bodyweight','hinge','compound','push','bilateral',3,20,NULL,NULL,NULL,60,120,'seed',true),
('banded_hip_abduction','Banded Hip Abduction','banded hip abduction','bodyweight_reps','glutes','glutes','band','isolation','isolation','push','bilateral',3,20,NULL,NULL,NULL,60,120,'seed',true),
-- Core
('plank','Plank','plank','timed','core','abs','bodyweight','core','isolation','static','bilateral',3,NULL,NULL,NULL,45,45,60,'seed',true),
('side_plank','Side Plank','side plank','timed','core','obliques','bodyweight','core','isolation','static','unilateral',3,NULL,NULL,NULL,30,45,60,'seed',true),
('hollow_hold','Hollow Hold','hollow hold','timed','core','abs','bodyweight','core','isolation','static','bilateral',3,NULL,NULL,NULL,40,45,60,'seed',true),
('dead_bug','Dead Bug','dead bug','timed','core','abs','bodyweight','core','isolation','static','bilateral',3,NULL,NULL,NULL,40,45,60,'seed',true),
('crunch','Crunch','crunch','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,20,NULL,NULL,NULL,45,60,'seed',true),
('sit_up','Sit Up','sit up','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,15,NULL,NULL,NULL,45,60,'seed',true),
('lying_leg_raise','Lying Leg Raise','lying leg raise','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,15,NULL,NULL,NULL,45,60,'seed',true),
('hanging_leg_raise','Hanging Leg Raise','hanging leg raise','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,12,NULL,NULL,NULL,45,60,'seed',true),
('hanging_knee_raise','Hanging Knee Raise','hanging knee raise','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,15,NULL,NULL,NULL,45,60,'seed',true),
('russian_twist','Russian Twist','russian twist','bodyweight_reps','core','obliques','bodyweight','core','isolation',NULL,'alternating',3,20,NULL,NULL,NULL,45,60,'seed',true),
('bicycle_crunch','Bicycle Crunch','bicycle crunch','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'alternating',3,20,NULL,NULL,NULL,45,60,'seed',true),
('mountain_climber','Mountain Climber','mountain climber','bodyweight_reps','core','abs','bodyweight','core','compound',NULL,'alternating',3,20,NULL,NULL,NULL,45,60,'seed',true),
('flutter_kick','Flutter Kick','flutter kick','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,20,NULL,NULL,NULL,45,60,'seed',true),
('v_up','V Up','v up','bodyweight_reps','core','abs','bodyweight','core','isolation',NULL,'bilateral',3,15,NULL,NULL,NULL,45,60,'seed',true),
('cable_crunch','Cable Crunch','cable crunch','weight_reps','core','abs','cable','core','isolation',NULL,'bilateral',3,15,60,5,NULL,60,90,'seed',true),
('weighted_russian_twist','Weighted Russian Twist','weighted russian twist','weight_reps','core','obliques','dumbbell','core','isolation',NULL,'alternating',3,20,25,5,NULL,60,90,'seed',true),
-- Cardio
('treadmill_run','Treadmill Run','treadmill run','distance_time','cardio',NULL,'machine',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,1200,60,60,'seed',true),
('treadmill_incline_walk','Treadmill Incline Walk','treadmill incline walk','distance_time','cardio',NULL,'machine',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,1200,60,60,'seed',true),
('stationary_bike','Stationary Bike','stationary bike','distance_time','cardio',NULL,'machine',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,1200,60,60,'seed',true),
('rowing_erg','Rowing Erg','rowing erg','distance_time','cardio',NULL,'machine',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,900,60,60,'seed',true),
('elliptical','Elliptical','elliptical','distance_time','cardio',NULL,'machine',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,1200,60,60,'seed',true),
('stair_climber','Stair Climber','stair climber','distance_time','cardio',NULL,'machine',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,900,60,60,'seed',true),
('outdoor_run','Outdoor Run','outdoor run','distance_time','cardio',NULL,'bodyweight',NULL,'compound',NULL,'bilateral',1,NULL,NULL,NULL,1800,60,60,'seed',true),
('jump_rope','Jump Rope','jump rope','timed','cardio',NULL,'bodyweight',NULL,'compound',NULL,'bilateral',3,NULL,NULL,NULL,120,60,60,'seed',true),
-- Full Body
('burpee','Burpee','burpee','bodyweight_reps','full_body',NULL,'bodyweight',NULL,'compound',NULL,'bilateral',3,12,NULL,NULL,NULL,90,120,'seed',true),
('kettlebell_swing','Kettlebell Swing','kettlebell swing','weight_reps','full_body',NULL,'kettlebell','hinge','compound','pull','bilateral',3,15,35,5,NULL,90,120,'seed',true),
('barbell_thruster','Barbell Thruster','barbell thruster','weight_reps','full_body',NULL,'barbell','squat','compound','push','bilateral',3,10,95,5,NULL,90,120,'seed',true),
('dumbbell_thruster','Dumbbell Thruster','dumbbell thruster','weight_reps','full_body',NULL,'dumbbell','squat','compound','push','bilateral',3,12,30,5,NULL,90,120,'seed',true),
('barbell_clean_and_press','Barbell Clean And Press','barbell clean and press','weight_reps','full_body',NULL,'barbell','vertical_push','compound','push','bilateral',3,8,95,5,NULL,90,120,'seed',true),
('barbell_power_clean','Barbell Power Clean','barbell power clean','weight_reps','full_body',NULL,'barbell','hinge','compound','pull','bilateral',3,8,135,5,NULL,90,120,'seed',true),
('dumbbell_snatch','Dumbbell Snatch','dumbbell snatch','weight_reps','full_body',NULL,'dumbbell','hinge','compound','pull','bilateral',3,10,35,5,NULL,90,120,'seed',true),
('kettlebell_clean_and_press','Kettlebell Clean And Press','kettlebell clean and press','weight_reps','full_body',NULL,'kettlebell','vertical_push','compound','push','bilateral',3,10,35,5,NULL,90,120,'seed',true)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 5. exercise_relationship  (the knowledge graph)
--    type: progression | regression | substitute | variation_of | antagonist
--    Conventions (see data-models doc §5):
--      * variation_of: variant -> canonical movement
--      * progression : easier  -> harder   (regression is inferred as the inverse)
--      * substitute  : symmetric, both directions inserted
--      * antagonist  : symmetric, both directions inserted (for auto-supersets)
-- ----------------------------------------------------------------------------
insert into exercise_relationship (from_slug, to_slug, type) values
-- variation_of: chest press family -> barbell_bench_press
('incline_barbell_bench_press','barbell_bench_press','variation_of'),
('decline_barbell_bench_press','barbell_bench_press','variation_of'),
('dumbbell_bench_press','barbell_bench_press','variation_of'),
('incline_dumbbell_press','barbell_bench_press','variation_of'),
('decline_dumbbell_press','barbell_bench_press','variation_of'),
('machine_chest_press','barbell_bench_press','variation_of'),
('incline_machine_chest_press','barbell_bench_press','variation_of'),
('smith_machine_bench_press','barbell_bench_press','variation_of'),
('incline_smith_machine_bench_press','barbell_bench_press','variation_of'),
-- variation_of: chest fly family -> dumbbell_fly
('incline_dumbbell_fly','dumbbell_fly','variation_of'),
('pec_deck','dumbbell_fly','variation_of'),
('cable_crossover','dumbbell_fly','variation_of'),
('low_cable_crossover','cable_crossover','variation_of'),
('high_cable_crossover','cable_crossover','variation_of'),
-- variation_of: shoulder press family -> barbell_overhead_press
('dumbbell_shoulder_press','barbell_overhead_press','variation_of'),
('arnold_press','barbell_overhead_press','variation_of'),
('machine_shoulder_press','barbell_overhead_press','variation_of'),
('smith_machine_shoulder_press','barbell_overhead_press','variation_of'),
-- variation_of: lateral / front / rear delt & upright row families
('cable_lateral_raise','dumbbell_lateral_raise','variation_of'),
('machine_lateral_raise','dumbbell_lateral_raise','variation_of'),
('cable_front_raise','dumbbell_front_raise','variation_of'),
('barbell_front_raise','dumbbell_front_raise','variation_of'),
('cable_rear_delt_fly','dumbbell_rear_delt_fly','variation_of'),
('reverse_pec_deck','dumbbell_rear_delt_fly','variation_of'),
('face_pull','dumbbell_rear_delt_fly','variation_of'),
('cable_upright_row','barbell_upright_row','variation_of'),
('dumbbell_upright_row','barbell_upright_row','variation_of'),
-- variation_of: row family -> barbell_row
('dumbbell_row','barbell_row','variation_of'),
('seated_cable_row','barbell_row','variation_of'),
('t_bar_row','barbell_row','variation_of'),
('smith_machine_row','barbell_row','variation_of'),
('inverted_row','barbell_row','variation_of'),
-- variation_of: vertical pull family -> pull_up
('lat_pulldown','pull_up','variation_of'),
('chin_up','pull_up','variation_of'),
-- variation_of: shrug family -> barbell_shrug
('dumbbell_shrug','barbell_shrug','variation_of'),
('cable_shrug','barbell_shrug','variation_of'),
-- variation_of: biceps curl family -> barbell_bicep_curl
('dumbbell_bicep_curl','barbell_bicep_curl','variation_of'),
('ez_bar_curl','barbell_bicep_curl','variation_of'),
('hammer_curl','barbell_bicep_curl','variation_of'),
('preacher_curl','barbell_bicep_curl','variation_of'),
('cable_curl','barbell_bicep_curl','variation_of'),
('incline_dumbbell_curl','barbell_bicep_curl','variation_of'),
('concentration_curl','barbell_bicep_curl','variation_of'),
-- variation_of: triceps extension family -> rope_pushdown
('overhead_dumbbell_tricep_extension','rope_pushdown','variation_of'),
('overhead_cable_tricep_extension','rope_pushdown','variation_of'),
('skullcrusher','rope_pushdown','variation_of'),
('tricep_kickback','rope_pushdown','variation_of'),
('machine_tricep_extension','rope_pushdown','variation_of'),
-- variation_of: squat family -> barbell_back_squat
('barbell_front_squat','barbell_back_squat','variation_of'),
('goblet_squat','barbell_back_squat','variation_of'),
('dumbbell_squat','barbell_back_squat','variation_of'),
('hack_squat','barbell_back_squat','variation_of'),
('leg_press','barbell_back_squat','variation_of'),
('smith_machine_squat','barbell_back_squat','variation_of'),
-- variation_of: lunge family -> walking_lunge
('reverse_lunge','walking_lunge','variation_of'),
('bulgarian_split_squat','walking_lunge','variation_of'),
('dumbbell_step_up','walking_lunge','variation_of'),
-- variation_of: hamstring / RDL / leg curl families
('seated_leg_curl','lying_leg_curl','variation_of'),
('stiff_leg_deadlift','romanian_deadlift','variation_of'),
('dumbbell_romanian_deadlift','romanian_deadlift','variation_of'),
-- variation_of: calf raise family -> standing_calf_raise
('seated_calf_raise','standing_calf_raise','variation_of'),
('leg_press_calf_raise','standing_calf_raise','variation_of'),
('dumbbell_calf_raise','standing_calf_raise','variation_of'),
-- variation_of: glute family -> barbell_hip_thrust
('machine_hip_thrust','barbell_hip_thrust','variation_of'),
('barbell_glute_bridge','barbell_hip_thrust','variation_of'),
('glute_bridge','barbell_hip_thrust','variation_of'),
-- variation_of: core families
('sit_up','crunch','variation_of'),
('cable_crunch','crunch','variation_of'),
('bicycle_crunch','crunch','variation_of'),
('hanging_knee_raise','hanging_leg_raise','variation_of'),
('lying_leg_raise','hanging_leg_raise','variation_of'),

-- substitute (symmetric — both directions): equipment-swap options
('barbell_bench_press','dumbbell_bench_press','substitute'),
('dumbbell_bench_press','barbell_bench_press','substitute'),
('barbell_bench_press','machine_chest_press','substitute'),
('machine_chest_press','barbell_bench_press','substitute'),
('incline_barbell_bench_press','incline_dumbbell_press','substitute'),
('incline_dumbbell_press','incline_barbell_bench_press','substitute'),
('barbell_overhead_press','dumbbell_shoulder_press','substitute'),
('dumbbell_shoulder_press','barbell_overhead_press','substitute'),
('barbell_overhead_press','machine_shoulder_press','substitute'),
('machine_shoulder_press','barbell_overhead_press','substitute'),
('dumbbell_lateral_raise','cable_lateral_raise','substitute'),
('cable_lateral_raise','dumbbell_lateral_raise','substitute'),
('barbell_row','dumbbell_row','substitute'),
('dumbbell_row','barbell_row','substitute'),
('barbell_row','seated_cable_row','substitute'),
('seated_cable_row','barbell_row','substitute'),
('lat_pulldown','pull_up','substitute'),
('pull_up','lat_pulldown','substitute'),
('barbell_bicep_curl','dumbbell_bicep_curl','substitute'),
('dumbbell_bicep_curl','barbell_bicep_curl','substitute'),
('rope_pushdown','overhead_dumbbell_tricep_extension','substitute'),
('overhead_dumbbell_tricep_extension','rope_pushdown','substitute'),
('barbell_back_squat','leg_press','substitute'),
('leg_press','barbell_back_squat','substitute'),
('barbell_back_squat','goblet_squat','substitute'),
('goblet_squat','barbell_back_squat','substitute'),
('barbell_hip_thrust','machine_hip_thrust','substitute'),
('machine_hip_thrust','barbell_hip_thrust','substitute'),
('standing_calf_raise','seated_calf_raise','substitute'),
('seated_calf_raise','standing_calf_raise','substitute'),
('lying_leg_curl','seated_leg_curl','substitute'),
('seated_leg_curl','lying_leg_curl','substitute'),

-- progression (easier -> harder)
('push_up','chest_dip','progression'),
('inverted_row','pull_up','progression'),
('chin_up','pull_up','progression'),
('bodyweight_squat','barbell_back_squat','progression'),
('goblet_squat','barbell_front_squat','progression'),
('glute_bridge','barbell_hip_thrust','progression'),
('crunch','hanging_leg_raise','progression'),
('sit_up','v_up','progression'),
('plank','hollow_hold','progression'),
('hanging_knee_raise','hanging_leg_raise','progression'),

-- antagonist (symmetric — both directions): push/pull & opposing pairs for supersets
('barbell_bench_press','barbell_row','antagonist'),
('barbell_row','barbell_bench_press','antagonist'),
('barbell_overhead_press','pull_up','antagonist'),
('pull_up','barbell_overhead_press','antagonist'),
('barbell_bicep_curl','rope_pushdown','antagonist'),
('rope_pushdown','barbell_bicep_curl','antagonist'),
('dumbbell_bicep_curl','overhead_dumbbell_tricep_extension','antagonist'),
('overhead_dumbbell_tricep_extension','dumbbell_bicep_curl','antagonist'),
('leg_extension','lying_leg_curl','antagonist'),
('lying_leg_curl','leg_extension','antagonist'),
('barbell_back_squat','romanian_deadlift','antagonist'),
('romanian_deadlift','barbell_back_squat','antagonist'),
('crunch','back_extension','antagonist'),
('back_extension','crunch','antagonist')
on conflict (from_slug, to_slug, type) do nothing;

