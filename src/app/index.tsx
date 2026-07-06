import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Dimensions, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { useAudioPlayer } from 'expo-audio'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHIP_WIDTH = 70;
const MAX_X = (SCREEN_WIDTH / 2) - (SHIP_WIDTH / 2) - 10;
const MOVE_SPEED = 6;

// AAA Color Palette
const COLORS = {
  deepSpace: '#0A1035',
  spacePurple: '#2A1B54',
  skyBlue: '#44D6FF',
  darkSkyBlue: '#1CB0DF',
  mintGreen: '#38F5B7',
  darkMintGreen: '#18D597',
  goldenYellow: '#FFD447',
  darkGoldenYellow: '#DFB427',
  coralOrange: '#FF7A45',
  pink: '#FF4F9A',
  glassWhite: 'rgba(255, 255, 255, 0.15)',
};

const STAR_COUNT = 40;
const stars = Array.from({ length: STAR_COUNT }).map(() => ({
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_HEIGHT,
  size: Math.random() * 4 + 2,
  opacity: Math.random() * 0.5 + 0.3,
}));

export default function Index() {
  let [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });

  // --- Game States ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  
  // --- Settings States ---
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3); 

  const [shipX, setShipX] = useState(0); 
  const [asteroidX, setAsteroidX] = useState(0);
  const [asteroidY, setAsteroidY] = useState(-150); 

  // --- Animation Refs ---
  const bgAnim = useRef(new Animated.Value(0)).current; 
  const shipHoverY = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameOpacity = useRef(new Animated.Value(1)).current; 
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const titleHoverY = useRef(new Animated.Value(0)).current;
  
  const animatedShipX = useRef(new Animated.Value(0)).current;
  const explosionScale = useRef(new Animated.Value(0)).current;
  const explosionOpacity = useRef(new Animated.Value(1)).current;
  const shipOpacity = useRef(new Animated.Value(1)).current; 
  
  const moveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==========================================
  // --- AUDIO PLAYERS ---
  // ==========================================
  const bgmPlayer = useAudioPlayer(require('../../assets/audio/bgm.mp3'));
  const crashPlayer = useAudioPlayer(require('../../assets/audio/crash.mp3')); 

  useEffect(() => {
    bgmPlayer.loop = true;
    crashPlayer.loop = false; // explicitly prevent the sound effect from looping

    if (musicEnabled && isPlaying && !isPaused && !isGameOver) {
      bgmPlayer.play();
    } else {
      bgmPlayer.pause();
    }
  }, [musicEnabled, isPlaying, isPaused, isGameOver, bgmPlayer, crashPlayer]);
  // ==========================================

  // Load High Score & Settings
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedScore = await AsyncStorage.getItem('@high_score');
        const savedMusic = await AsyncStorage.getItem('@music_enabled');
        const savedSfx = await AsyncStorage.getItem('@sfx_enabled');
        
        if (savedScore !== null) setHighScore(parseInt(savedScore, 10));
        if (savedMusic !== null) setMusicEnabled(savedMusic === 'true');
        if (savedSfx !== null) setSfxEnabled(savedSfx === 'true');
      } catch (e) {}
    };
    loadData();
  }, []);

  // Save Settings
  const toggleMusic = () => {
    const newVal = !musicEnabled;
    setMusicEnabled(newVal);
    AsyncStorage.setItem('@music_enabled', newVal.toString());
  };
  const toggleSfx = () => {
    const newVal = !sfxEnabled;
    setSfxEnabled(newVal);
    AsyncStorage.setItem('@sfx_enabled', newVal.toString());
  };

  // --- Master Animation Loop ---
  useEffect(() => {
    Animated.loop(
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 4000, 
        easing: Easing.linear, 
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shipHoverY, { toValue: -12, duration: 1200, useNativeDriver: true }),
        Animated.timing(shipHoverY, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(titleHoverY, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(titleHoverY, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flameScale, { toValue: 1.8, duration: 60, useNativeDriver: true }),
          Animated.timing(flameScale, { toValue: 1, duration: 60, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(flameOpacity, { toValue: 0.3, duration: 60, useNativeDriver: true }),
          Animated.timing(flameOpacity, { toValue: 1, duration: 60, useNativeDriver: true })
        ])
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(playButtonScale, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(playButtonScale, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [bgAnim, shipHoverY, titleHoverY, flameScale, flameOpacity, playButtonScale]);

  const bgTranslateY1 = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_HEIGHT] });
  const bgTranslateY2 = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_HEIGHT, 0] });

  // --- GAME LOOP: DYNAMIC DIFFICULTY ---
  useEffect(() => {
    let gameLoop: ReturnType<typeof setInterval> | null = null;
    
    if (isPlaying && !isPaused && !isGameOver && !isExploding) {
      const baseSpeed = 12; 
      const speedMultiplier = Math.floor(score / 30);
      const currentSpeed = baseSpeed + (speedMultiplier * 1.5);

      gameLoop = setInterval(() => {
        setAsteroidY((prevY) => prevY + currentSpeed); 
      }, 16); 
    }
    return () => { if (gameLoop) clearInterval(gameLoop); };
  }, [isPlaying, isPaused, isGameOver, isExploding, score]); 

  // --- Invincibility Blink ---
  useEffect(() => {
    let blinkLoop: Animated.CompositeAnimation | null = null;
    
    if (isInvincible && !isExploding) {
      blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shipOpacity, { toValue: 0.2, duration: 150, useNativeDriver: true }),
          Animated.timing(shipOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ])
      );
      blinkLoop.start();
    } else {
      shipOpacity.setValue(1); 
    }
    return () => { if (blinkLoop) blinkLoop.stop(); };
  }, [isInvincible, isExploding, shipOpacity]);

  // --- Collision Detection ---
  useEffect(() => {
    const meteorHitbox = 40;
    const shipHeight = 70; 
    const shipBottomOffset = 160; 
    
    const shipTopY = SCREEN_HEIGHT - shipBottomOffset - shipHeight;
    const shipBottomY = SCREEN_HEIGHT - shipBottomOffset;

    const isYColliding = (asteroidY + meteorHitbox) > shipTopY && asteroidY < shipBottomY;
    const isXColliding = Math.abs(asteroidX - shipX) < (SHIP_WIDTH / 2 + meteorHitbox / 2);

    // FIXED: Added `isPlaying && !isGameOver` so it doesn't infinitely loop behind the Game Over menu!
    if (isPlaying && !isGameOver && isYColliding && isXColliding && !isExploding && !isInvincible) {
      
      // --- TRIGGER CRASH SFX ---
      if (sfxEnabled) {
        crashPlayer.seekTo(0); 
        crashPlayer.play();
      }

      stopMoving(); 
      setIsExploding(true);
      explosionScale.setValue(0);
      explosionOpacity.setValue(1);
      
      Animated.parallel([
        Animated.timing(explosionScale, { toValue: 4, duration: 600, useNativeDriver: true }),
        Animated.timing(explosionOpacity, { toValue: 0, duration: 600, useNativeDriver: true })
      ]).start(({ finished }) => {
        if (!finished) return; 

        setIsExploding(false);
        if (lives > 1) {
          setLives(lives - 1);
          setAsteroidY(-150);
          setAsteroidX(Math.floor(Math.random() * (MAX_X * 2)) - MAX_X);
          setIsInvincible(true);
          setTimeout(() => setIsInvincible(false), 2000); 
        } else {
          setLives(0);
          setIsPlaying(false);
          setIsGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            AsyncStorage.setItem('@high_score', score.toString());
          }
        }
      });
    } else if (asteroidY > SCREEN_HEIGHT) {
      setAsteroidY(-150);
      setAsteroidX(Math.floor(Math.random() * (MAX_X * 2)) - MAX_X);
      
      // Only grant points if actively playing
      if (isPlaying && !isGameOver && !isExploding) {
         setScore((prev) => prev + 10); 
      }
    }
  }, [asteroidY, asteroidX, shipX, isExploding, isInvincible, lives, score, highScore, sfxEnabled, crashPlayer, isPlaying, isGameOver]); 

  const handleStartGame = () => {
    stopMoving();
    explosionScale.setValue(0); 
    setScore(0);
    setLives(3);
    setShipX(0);
    animatedShipX.setValue(0); 
    setAsteroidY(-150); 
    setAsteroidX(Math.floor(Math.random() * (MAX_X * 2)) - MAX_X); 
    setIsGameOver(false);
    setIsExploding(false);
    setIsPaused(false);
    setIsInvincible(false);
    setIsPlaying(true);
  };

  const handleMainMenu = () => {
    stopMoving();
    explosionScale.setValue(0); 
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    setIsExploding(false);
  };

  const startMovingLeft = () => {
    if (moveInterval.current) clearInterval(moveInterval.current);
    moveInterval.current = setInterval(() => {
      setShipX((prev) => {
        const newVal = Math.max(prev - MOVE_SPEED, -MAX_X);
        animatedShipX.setValue(newVal); 
        return newVal;
      });
    }, 16); 
  };

  const startMovingRight = () => {
    if (moveInterval.current) clearInterval(moveInterval.current);
    moveInterval.current = setInterval(() => {
      setShipX((prev) => {
        const newVal = Math.min(prev + MOVE_SPEED, MAX_X);
        animatedShipX.setValue(newVal);
        return newVal;
      });
    }, 16);
  };

  const stopMoving = () => {
    if (moveInterval.current) clearInterval(moveInterval.current);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden={true} />

      <LinearGradient colors={[COLORS.deepSpace, COLORS.spacePurple]} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: bgTranslateY1 }] }]}>
          {stars.map((star, i) => (
            <View key={`star1-${i}`} style={[styles.star, { left: star.x, top: star.y, width: star.size, height: star.size, opacity: star.opacity }]} />
          ))}
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: bgTranslateY2 }] }]}>
          {stars.map((star, i) => (
            <View key={`star2-${i}`} style={[styles.star, { left: star.x, top: star.y, width: star.size, height: star.size, opacity: star.opacity }]} />
          ))}
        </Animated.View>
      </LinearGradient>

      {/* =========================================
                     SETTINGS OVERLAY
          ========================================= */}
      {isSettingsOpen && (
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>SETTINGS</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="musical-notes" size={24} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.settingText}>MUSIC</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleBtn, musicEnabled ? styles.toggleOn : styles.toggleOff]} 
                onPress={toggleMusic}
              >
                <Text style={styles.toggleText}>{musicEnabled ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Ionicons name="volume-high" size={24} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.settingText}>SOUND FX</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleBtn, sfxEnabled ? styles.toggleOn : styles.toggleOff]} 
                onPress={toggleSfx}
              >
                <Text style={styles.toggleText}>{sfxEnabled ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsSettingsOpen(false)}>
              <Text style={styles.btnTextMedium}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================
                     GAME OVER SCREEN
          ========================================= */}
      {isGameOver ? (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>MISSION{'\n'}FAILED</Text>
          <View style={styles.scoreCard}>
            <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
            <Text style={styles.finalScoreText}>{score}</Text>
            <Text style={styles.highScoreText}>BEST: {highScore}</Text>
          </View>

          <TouchableOpacity style={styles.btnPlay} activeOpacity={0.8} onPress={handleStartGame}>
            <Ionicons name="reload" size={28} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnTextLarge}>TRY AGAIN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.btnSecondary, { marginTop: 15 }]} activeOpacity={0.8} onPress={handleMainMenu}>
            <Ionicons name="home" size={24} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.btnTextMedium}>MAIN MENU</Text>
          </TouchableOpacity>
        </View>
      ) : !isPlaying && !isExploding ? (
        
      /* =========================================
                     MAIN MENU SCREEN
         ========================================= */
        <View style={styles.menuContainer}>
          
          <View style={styles.menuTopBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setIsSettingsOpen(true)}>
              <Ionicons name="settings-sharp" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.titleContainer, { transform: [{ translateY: titleHoverY }] }]}>
            <Text style={styles.titleSpace}>SPACE</Text>
            <Text style={styles.titleEscape}>ESCAPE</Text>
          </Animated.View>

          <Animated.View style={[styles.menuShipWrapper, { transform: [{ translateY: shipHoverY }] }]}>
            <View style={styles.spaceshipNose} />
            <View style={styles.spaceshipBody}>
              <View style={styles.spaceshipWindow} />
            </View>
            <View style={styles.spaceshipWings}>
              <View style={styles.wingLeft} />
              <View style={styles.wingRight} />
            </View>
            <View style={styles.engineBase} />
            <Animated.View style={[styles.flame, { opacity: flameOpacity, transform: [{ scaleY: flameScale }] }]} />
          </Animated.View>

          <View style={styles.menuButtonsWrapper}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleStartGame}>
              <Animated.View style={[styles.btnPlay, { transform: [{ scale: playButtonScale }] }]}>
                <Ionicons name="play" size={32} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnTextLarge}>PLAY</Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.btnSecondary}>
              <Ionicons name="rocket" size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.btnTextMedium}>MISSIONS</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (

      /* =========================================
                     GAMEPLAY SCREEN
         ========================================= */
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.hudContainer}>
            <View style={styles.hudPill}>
              <FontAwesome5 name="star" size={18} color={COLORS.goldenYellow} solid />
              <Text style={styles.hudText}>{score}</Text>
            </View>

            <View style={styles.hudPill}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Ionicons key={i} name={i < lives ? "heart" : "heart-outline"} size={20} color={COLORS.pink} style={{ marginHorizontal: 2 }} />
              ))}
            </View>

            <TouchableOpacity style={styles.pauseButton} onPress={() => { stopMoving(); setIsPaused(true); }}>
              <Ionicons name="pause" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {(isPlaying || isExploding) && !isPaused && (
            <View style={[styles.meteorContainer, { transform: [{ translateX: asteroidX }, { translateY: asteroidY }] }]}>
              <View style={styles.meteorTail} />
              <View style={styles.meteorCore} />
            </View>
          )}

          {isExploding ? (
            <Animated.View style={[styles.gameShipWrapper, { transform: [{ translateX: animatedShipX }] }]}>
              <Animated.View style={[styles.explosionCore, { transform: [{ scale: explosionScale }], opacity: explosionOpacity }]} />
              <Animated.View style={[styles.explosionRing, { transform: [{ scale: explosionScale }], opacity: explosionOpacity }]} />
            </Animated.View>
          ) : (
            <Animated.View style={[styles.gameShipWrapper, { opacity: shipOpacity, transform: [{ translateX: animatedShipX }, { translateY: shipHoverY }] }]}>
              <View style={styles.spaceshipNose} />
              <View style={styles.spaceshipBody}>
                <View style={styles.spaceshipWindow} />
              </View>
              <View style={styles.spaceshipWings}>
                <View style={styles.wingLeft} />
                <View style={styles.wingRight} />
              </View>
              <View style={styles.engineBase} />
              <Animated.View style={[styles.flame, { opacity: flameOpacity, transform: [{ scaleY: flameScale }] }]} />
            </Animated.View>
          )}

          {isPlaying && !isExploding && !isPaused && (
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPressIn={startMovingLeft} onPressOut={stopMoving}>
                <Ionicons name="arrow-back" size={36} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPressIn={startMovingRight} onPressOut={stopMoving}>
                <Ionicons name="arrow-forward" size={36} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {isPaused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.titleSpace}>PAUSED</Text>
              <TouchableOpacity style={[styles.btnPlay, { marginTop: 40 }]} activeOpacity={0.8} onPress={() => setIsPaused(false)}>
                <Ionicons name="play" size={28} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnTextLarge}>RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSecondary, { marginTop: 20, backgroundColor: COLORS.coralOrange, borderBottomColor: '#D95A25' }]} activeOpacity={0.8} onPress={handleMainMenu}>
                <Ionicons name="home" size={24} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.btnTextMedium}>MAIN MENU</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepSpace,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // --- Settings Styles ---
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 16, 53, 0.9)', 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  settingsModal: {
    backgroundColor: COLORS.glassWhite,
    width: '85%',
    padding: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  settingsTitle: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: COLORS.mintGreen,
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 20,
    color: '#FFF',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderBottomWidth: 3,
  },
  toggleOn: {
    backgroundColor: COLORS.mintGreen,
    borderBottomColor: COLORS.darkMintGreen,
  },
  toggleOff: {
    backgroundColor: '#555',
    borderBottomColor: '#333',
  },
  toggleText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#FFF',
  },

  // --- AAA Menu Buttons ---
  btnPlay: {
    flexDirection: 'row',
    backgroundColor: COLORS.mintGreen,
    width: SCREEN_WIDTH * 0.7,
    paddingVertical: 15,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 8,
    borderBottomColor: COLORS.darkMintGreen, 
    shadowColor: COLORS.mintGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  btnSecondary: {
    flexDirection: 'row',
    backgroundColor: COLORS.skyBlue,
    width: SCREEN_WIDTH * 0.6,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: COLORS.darkSkyBlue,
  },
  btnTextLarge: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    includeFontPadding: false,
  },
  btnTextMedium: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 22,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    includeFontPadding: false,
  },

  // --- Menu Styles ---
  menuContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  menuTopBar: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSpace: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 56,
    color: '#FFFFFF',
    lineHeight: 60,
    textShadowColor: COLORS.skyBlue,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  titleEscape: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 64,
    color: COLORS.goldenYellow,
    lineHeight: 65,
    marginTop: -15,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 5,
  },
  menuShipWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 50,
    transform: [{ scale: 1.2 }],
  },
  menuButtonsWrapper: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    backgroundColor: COLORS.spacePurple,
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#1A0B34',
  },

  // --- Game HUD ---
  hudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 50, 
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassWhite,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hudText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 8,
    includeFontPadding: false,
  },
  pauseButton: {
    backgroundColor: COLORS.glassWhite,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 16, 53, 0.9)', 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  controlBtn: {
    backgroundColor: COLORS.glassWhite,
    width: 80,
    height: 80,
    borderRadius: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: COLORS.skyBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },

  // --- Game Entities ---
  meteorContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    alignItems: 'center',
    width: 50,
  },
  meteorTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF9900',
    marginBottom: -15, 
    opacity: 0.8,
  },
  meteorCore: {
    width: 35,
    height: 35,
    backgroundColor: COLORS.coralOrange,
    borderRadius: 20,
    shadowColor: COLORS.coralOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  gameShipWrapper: {
    position: 'absolute',
    bottom: 160,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceshipNose: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF', 
  },
  spaceshipBody: {
    width: 24,
    height: 40,
    backgroundColor: '#FFFFFF', 
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.skyBlue, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
  },
  spaceshipWindow: {
    width: 12,
    height: 16,
    borderRadius: 6,
    backgroundColor: COLORS.deepSpace,
    borderWidth: 2,
    borderColor: COLORS.skyBlue,
    marginTop: -10,
  },
  spaceshipWings: {
    position: 'absolute',
    top: 25, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 70,
    zIndex: -1,
  },
  wingLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 40,
    borderRightWidth: 23,
    borderTopColor: 'transparent',
    borderRightColor: COLORS.coralOrange, 
    borderBottomWidth: 5,
    borderBottomColor: COLORS.goldenYellow, 
  },
  wingRight: {
    width: 0,
    height: 0,
    borderTopWidth: 40,
    borderLeftWidth: 23,
    borderTopColor: 'transparent',
    borderLeftColor: COLORS.coralOrange, 
    borderBottomWidth: 5,
    borderBottomColor: COLORS.goldenYellow, 
  },
  engineBase: {
    width: 16,
    height: 8,
    backgroundColor: '#6C5CE7',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  flame: {
    width: 8,
    height: 25,
    backgroundColor: COLORS.skyBlue, 
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 2,
    shadowColor: COLORS.skyBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  explosionCore: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#FF9900',
    borderRadius: 20,
  },
  explosionRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderWidth: 4,
    borderColor: COLORS.pink,
    borderRadius: 25,
  },

  // --- Game Over Styles ---
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  gameOverTitle: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 52,
    color: COLORS.coralOrange,
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 5,
  },
  scoreCard: {
    backgroundColor: COLORS.glassWhite,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    marginBottom: 40,
  },
  finalScoreLabel: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
    color: COLORS.goldenYellow,
    letterSpacing: 2,
  },
  finalScoreText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 64,
    color: '#FFFFFF',
    textShadowColor: COLORS.skyBlue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginVertical: -10,
  },
  highScoreText: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 18,
    color: COLORS.mintGreen,
  },
});