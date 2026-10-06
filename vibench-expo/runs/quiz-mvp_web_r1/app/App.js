import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QUESTIONS from './assets/questions.json';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sampleQuestions(allQuestions, category, count = 10) {
  const pool = allQuestions.filter((q) => q.category === category);
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function getCategories(allQuestions) {
  const seen = [];
  allQuestions.forEach((q) => {
    if (!seen.includes(q.category)) seen.push(q.category);
  });
  return seen;
}

export function computeAchievements(correctCount, total, maxStreak) {
  const earned = [];
  if (total === 10 && correctCount === 10) earned.push('Perfect Round');
  if (maxStreak >= 5) earned.push('Hot Streak');
  if (maxStreak >= 3) earned.push('Triple Win');
  return earned;
}

export default function App() {
  const categories = useMemo(() => getCategories(QUESTIONS), []);
  const countsByCategory = useMemo(() => {
    const counts = {};
    QUESTIONS.forEach((q) => {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }, []);

  // screen: 'categories' | 'confirm' | 'quiz' | 'results'
  const [screen, setScreen] = useState('categories');
  const [category, setCategory] = useState(null);
  const [isSurprise, setIsSurprise] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startQuiz = (chosenCategory) => {
    setQuizQuestions(sampleQuestions(QUESTIONS, chosenCategory, 10));
    setQuestionIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setStartTime(Date.now());
    setScreen('quiz');
  };

  const handleCategoryPress = (cat) => {
    setIsSurprise(false);
    setCategory(cat);
    if ((countsByCategory[cat] || 0) < 10) {
      setScreen('confirm');
    } else {
      startQuiz(cat);
    }
  };

  const handleSurpriseMe = () => {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    setIsSurprise(true);
    setCategory(cat);
    setScreen('confirm');
  };

  const handleAnswer = (optionKey) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionKey);
    const currentQuestion = quizQuestions[questionIndex];
    if (optionKey === currentQuestion.correct_option) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setMaxStreak((m) => Math.max(m, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (questionIndex + 1 < quizQuestions.length) {
      setQuestionIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
      setScreen('results');
    }
  };

  const handleNewCategory = () => {
    setCategory(null);
    setIsSurprise(false);
    setScreen('categories');
  };

  let content = null;

  if (screen === 'categories') {
    content = (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        testID="category-list"
      >
        <Text style={styles.title} testID="app-title">
          Quiz Categories
        </Text>
        <Text style={styles.subtitle}>Pick a category to start the quiz</Text>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={styles.categoryButton}
            onPress={() => handleCategoryPress(cat)}
            testID={`category-${cat}`}
            accessibilityRole="button"
            accessibilityLabel={cat}
          >
            <Text style={styles.categoryButtonText}>{cat}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.categoryButton, styles.surpriseButton]}
          onPress={handleSurpriseMe}
          testID="surprise-me"
          accessibilityRole="button"
          accessibilityLabel="Surprise Me!"
        >
          <Text style={[styles.categoryButtonText, styles.surpriseButtonText]}>
            Surprise Me!
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  } else if (screen === 'confirm') {
    const notEnough = (countsByCategory[category] || 0) < 10;
    content = (
      <View style={styles.centered}>
        {isSurprise && (
          <Text style={styles.surpriseText} testID="surprise-category">
            Surprise! Your category is: {category}
          </Text>
        )}
        {!isSurprise && (
          <Text style={styles.surpriseText} testID="confirm-category">
            Category: {category}
          </Text>
        )}
        {notEnough && (
          <Text style={styles.warningText} testID="not-enough-warning">
            Not enough questions in this category for all accomplishments
          </Text>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => startQuiz(category)}
          testID="proceed-button"
          accessibilityRole="button"
          accessibilityLabel={notEnough ? 'Proceed Anyway' : 'Start Quiz'}
        >
          <Text style={styles.primaryButtonText}>
            {notEnough ? 'Proceed Anyway' : 'Start Quiz'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleNewCategory}
          testID="back-to-categories"
          accessibilityRole="button"
          accessibilityLabel="Back to Categories"
        >
          <Text style={styles.secondaryButtonText}>Back to Categories</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (screen === 'quiz') {
    const currentQuestion = quizQuestions[questionIndex];
    const answered = selectedOption !== null;
    const isCorrect = answered && selectedOption === currentQuestion.correct_option;
    const isLast = questionIndex + 1 >= quizQuestions.length;
    content = (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.categoryLabel} testID="quiz-category">
          Category: {category}
        </Text>
        <Text style={styles.progressText} testID="progress-indicator">
          Question {questionIndex + 1} of {quizQuestions.length}
        </Text>
        <Text style={styles.questionText} testID="question-text">
          {currentQuestion.question}
        </Text>
        {OPTION_KEYS.map((key) => {
          const optionText = currentQuestion[`option_${key.toLowerCase()}`];
          const isCorrectOption = key === currentQuestion.correct_option;
          const isSelected = key === selectedOption;
          const optionStyles = [styles.optionButton];
          if (answered && isCorrectOption) optionStyles.push(styles.optionCorrect);
          else if (answered && isSelected) optionStyles.push(styles.optionIncorrect);
          return (
            <TouchableOpacity
              key={key}
              style={optionStyles}
              onPress={() => handleAnswer(key)}
              disabled={answered}
              testID={`option-${key}`}
              accessibilityRole="button"
              accessibilityLabel={`${key}. ${optionText}`}
            >
              <Text style={styles.optionText}>
                {key}. {optionText}
              </Text>
            </TouchableOpacity>
          );
        })}
        {answered && (
          <View style={styles.feedbackBox} testID="feedback-box">
            <Text
              style={[styles.feedbackText, isCorrect ? styles.correctText : styles.incorrectText]}
              testID="feedback-text"
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </Text>
            <Text style={styles.explanationText} testID="explanation-text">
              {currentQuestion.explanation}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              testID="next-button"
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'See Results' : 'Next Question'}
            >
              <Text style={styles.primaryButtonText}>
                {isLast ? 'See Results' : 'Next Question'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  } else if (screen === 'results') {
    const total = quizQuestions.length;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const achievements = computeAchievements(correctCount, total, maxStreak);
    content = (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} testID="results-title">
          Results
        </Text>
        <Text style={styles.scoreText} testID="score-text">
          {correctCount}/{total} Correct ({percent}%)
        </Text>
        <Text style={styles.timeText} testID="time-text">
          Time: {elapsedSeconds} seconds
        </Text>
        <Text style={styles.sectionHeader}>Achievements</Text>
        {achievements.length === 0 ? (
          <Text style={styles.noAchievementsText} testID="no-achievements">
            No achievements this round
          </Text>
        ) : (
          achievements.map((name) => (
            <Text
              key={name}
              style={styles.achievementText}
              testID={`achievement-${name.replace(/\s+/g, '-')}`}
            >
              {name}
            </Text>
          ))
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => startQuiz(category)}
          testID="play-again"
          accessibilityRole="button"
          accessibilityLabel="Play Again"
        >
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleNewCategory}
          testID="new-category"
          accessibilityRole="button"
          accessibilityLabel="New Category"
        >
          <Text style={styles.secondaryButtonText}>New Category</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  surpriseButton: {
    backgroundColor: '#fdf4ff',
    borderColor: '#f0abfc',
  },
  surpriseButtonText: {
    color: '#a21caf',
  },
  surpriseText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 15,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  optionIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  optionText: {
    fontSize: 16,
    color: '#0f172a',
  },
  feedbackBox: {
    marginTop: 8,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  correctText: {
    color: '#16a34a',
  },
  incorrectText: {
    color: '#dc2626',
  },
  explanationText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  noAchievementsText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
});
