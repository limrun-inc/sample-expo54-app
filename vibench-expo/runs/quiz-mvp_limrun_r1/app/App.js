import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import questionsData from './assets/questions.json';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const MAX_QUESTIONS = 10;

function getCategories() {
  const seen = [];
  for (const q of questionsData) {
    if (!seen.includes(q.category)) seen.push(q.category);
  }
  return seen;
}

function sampleQuestions(category) {
  const pool = questionsData.filter((q) => q.category === category);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, MAX_QUESTIONS);
}

function countInCategory(category) {
  return questionsData.filter((q) => q.category === category).length;
}

export default function App() {
  // screen: 'categories' | 'warning' | 'quiz' | 'results'
  const [screen, setScreen] = useState('categories');
  const [category, setCategory] = useState(null);
  const [surprise, setSurprise] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const categories = useMemo(getCategories, []);

  const beginQuiz = (cat) => {
    setQuestions(sampleQuestions(cat));
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setStartTime(Date.now());
    setScreen('quiz');
  };

  const handleCategoryChosen = (cat, isSurprise) => {
    setCategory(cat);
    setSurprise(isSurprise);
    if (isSurprise || countInCategory(cat) < MAX_QUESTIONS) {
      // Show interstitial for surprise reveal and/or the not-enough-questions warning.
      setScreen('warning');
    } else {
      beginQuiz(cat);
    }
  };

  const handleSurpriseMe = () => {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    handleCategoryChosen(cat, true);
  };

  const handleAnswer = (key) => {
    if (selectedOption !== null) return;
    setSelectedOption(key);
    const q = questions[currentIndex];
    if (key === q.correct_option) {
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
    if (currentIndex + 1 >= questions.length) {
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
      setScreen('results');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {screen === 'categories' && (
        <CategoryScreen
          categories={categories}
          onSelect={(cat) => handleCategoryChosen(cat, false)}
          onSurprise={handleSurpriseMe}
        />
      )}
      {screen === 'warning' && (
        <WarningScreen
          category={category}
          surprise={surprise}
          notEnough={countInCategory(category) < MAX_QUESTIONS}
          onProceed={() => beginQuiz(category)}
          onBack={() => setScreen('categories')}
        />
      )}
      {screen === 'quiz' && questions.length > 0 && (
        <QuizScreen
          category={category}
          question={questions[currentIndex]}
          index={currentIndex}
          total={questions.length}
          selectedOption={selectedOption}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      )}
      {screen === 'results' && (
        <ResultsScreen
          correctCount={correctCount}
          total={questions.length}
          maxStreak={maxStreak}
          elapsedSeconds={elapsedSeconds}
          onPlayAgain={() => beginQuiz(category)}
          onNewCategory={() => setScreen('categories')}
        />
      )}
    </SafeAreaView>
  );
}

function CategoryScreen({ categories, onSelect, onSurprise }) {
  return (
    <View style={styles.container} testID="category-screen">
      <Text style={styles.title} testID="category-title">
        Choose a Category
      </Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        testID="category-list"
      >
        <TouchableOpacity
          style={[styles.categoryButton, styles.surpriseButton]}
          onPress={onSurprise}
          testID="category-surprise-me"
          accessibilityLabel="Surprise Me!"
        >
          <Text style={styles.surpriseButtonText}>Surprise Me!</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={styles.categoryButton}
            onPress={() => onSelect(cat)}
            testID={`category-${cat}`}
            accessibilityLabel={cat}
          >
            <Text style={styles.categoryButtonText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function WarningScreen({ category, surprise, notEnough, onProceed, onBack }) {
  return (
    <View style={[styles.container, styles.centered]} testID="warning-screen">
      {surprise && (
        <Text style={styles.surpriseReveal} testID="surprise-category">
          Surprise! Your category is: {category}
        </Text>
      )}
      {!surprise && (
        <Text style={styles.surpriseReveal} testID="chosen-category">
          Category: {category}
        </Text>
      )}
      {notEnough && (
        <Text style={styles.warningText} testID="warning-text">
          Not enough questions in this category for all accomplishments
        </Text>
      )}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onProceed}
        testID="proceed-button"
        accessibilityLabel={notEnough ? 'Proceed Anyway' : 'Start Quiz'}
      >
        <Text style={styles.primaryButtonText}>
          {notEnough ? 'Proceed Anyway' : 'Start Quiz'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onBack}
        testID="back-to-categories"
        accessibilityLabel="Back to Categories"
      >
        <Text style={styles.secondaryButtonText}>Back to Categories</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuizScreen({
  category,
  question,
  index,
  total,
  selectedOption,
  onAnswer,
  onNext,
}) {
  const answered = selectedOption !== null;
  const isCorrect = answered && selectedOption === question.correct_option;
  const isLast = index + 1 >= total;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.quizContent}
      testID="quiz-screen"
    >
      <Text style={styles.categoryTag} testID="quiz-category">
        {category}
      </Text>
      <Text style={styles.progress} testID="progress-indicator">
        Question {index + 1} of {total}
      </Text>
      <Text style={styles.questionText} testID="question-text">
        {question.question}
      </Text>
      {OPTION_KEYS.map((key) => {
        const optionText = question[`option_${key.toLowerCase()}`];
        const isCorrectOption = key === question.correct_option;
        const isSelected = key === selectedOption;
        const optionStyles = [styles.optionButton];
        if (answered && isCorrectOption) optionStyles.push(styles.optionCorrect);
        else if (answered && isSelected) optionStyles.push(styles.optionIncorrect);
        return (
          <TouchableOpacity
            key={key}
            style={optionStyles}
            onPress={() => onAnswer(key)}
            disabled={answered}
            testID={`option-${key}`}
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
            {question.explanation}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNext}
            testID="next-button"
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
}

function ResultsScreen({
  correctCount,
  total,
  maxStreak,
  elapsedSeconds,
  onPlayAgain,
  onNewCategory,
}) {
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const achievements = [];
  if (correctCount === total && total === MAX_QUESTIONS) achievements.push('Perfect Round');
  if (maxStreak >= 5) achievements.push('Hot Streak');
  if (maxStreak >= 3) achievements.push('Triple Win');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.resultsContent}
      testID="results-screen"
    >
      <Text style={styles.title} testID="results-title">
        Results
      </Text>
      <Text style={styles.scoreText} testID="score-text">
        {correctCount}/{total} Correct ({percent}%)
      </Text>
      <Text style={styles.timeText} testID="time-text">
        Time: {elapsedSeconds} seconds
      </Text>
      <Text style={styles.achievementsHeader}>Achievements</Text>
      {achievements.length === 0 ? (
        <Text style={styles.achievementText} testID="no-achievements">
          No achievements this round
        </Text>
      ) : (
        achievements.map((a) => (
          <Text
            key={a}
            style={styles.achievementText}
            testID={`achievement-${a.replace(/\s+/g, '-')}`}
          >
            {a}
          </Text>
        ))
      )}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onPlayAgain}
        testID="play-again-button"
        accessibilityLabel="Play Again"
      >
        <Text style={styles.primaryButtonText}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onNewCategory}
        testID="new-category-button"
        accessibilityLabel="New Category"
      >
        <Text style={styles.secondaryButtonText}>New Category</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  quizContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryButtonText: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '600',
  },
  surpriseButton: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  surpriseButtonText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '700',
  },
  surpriseReveal: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 16,
    color: '#b45309',
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryTag: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 4,
  },
  progress: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionCorrect: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  optionIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
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
    fontWeight: '700',
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
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  secondaryButtonText: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 17,
    color: '#475569',
    marginBottom: 24,
  },
  achievementsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 6,
  },
});
