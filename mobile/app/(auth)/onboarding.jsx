import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';

const slides = [
  {
    title: 'La référence du génie électrique sur chantier.',
    description:
      'Suivez vos plans, gérez vos équipes et sécurisez vos installations en temps réel.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC__OIAaVXQSeE8s_IoryMtzvQnAupJ2q74H_wWX8C9fpIPywaoIb4ay9dlhRlTv7_ST_uI7RIgsx7F2o_uJtxEBnkbWVNZSu6nGBq-wGzSYfzlJNB6C7oNmx6nd4exq8hZzGXDR7EIrxPyVbWlSAF7k_r43ILyPLkiac5mxhs2gfnF1VhvVxifxJJ3GlQeXhNZgCeBaVad-Pc47Aab9T5BGt651jhAbU9RR-1oZ4tyF7Ptaq9rp15igOrj9sJY58nehA0s6ts2SdY',
  },
  {
    title: 'Gérez vos Projets',
    description:
      "Centralisez vos plans électriques et suivez l'avancement du chantier en temps réel.",
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB9SL7h7GLdDr9KoGOoQR-A-F2tjpZeJBNamA8B8HV3hBWGqQKSiLq4vHw3UMwoPPPklUVw3ODYEjns3Q7JkDKX5SFHOsCxtjqvFLcQeZsfEd3E9THz9M5LThbzA5WyUB19q6VEglLn_QGOpMIoEXGHr5wC481tJXsanEc2cz63F_PzGjW3FdKJjZLH0mRVuZ72iJwJsUI73hdlsPX6l-mdn33x6lER0_Y7LYbIyIU8vFHjbz0sy31_b_YVuUhpE4rdMoSf2CKQ35Q',
  },
  {
    title: 'Suivez vos Tâches',
    description:
      'Organisez vos journées sur le chantier et signalez les blocages instantanément.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAq-_m0TIjVcB6VaDvksPMRpBP19InPi2f3Yr42JqAF_slr1wVLTPoyRRDJlVmLqQXfZ5jXSAi_SqQO5cpcTssB7sE7QSs6bOjIFnF5lWKgG-K_1GkrR6ZAbr9ANZltwE5Q3PQoNUJdgIvJkwtR8IWEMyIhwzYV-gcOlShllwNpg-aEBgnqNMM6mmF3mC82bYt_6xRpPoKbkdFm_CJLbT_4viBcc4ZCeJExJ-qUNMEV-lcqexl3Sd0Nz2S9Nb0s-bYwl2JwiUAN7RI',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <View style={styles.container}>
        <Text style={styles.title}>ChantierPro</Text>
      <Image source={{ uri: slide.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        {/* Indicators */}
        <View style={styles.indicators}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            index === slides.length - 1
              ? router.replace('/(auth)/login')
              : setIndex(index + 1)
          }
        >
          <Text style={styles.primaryText}>
            {index === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.secondaryText}>
            J’ai déjà un compte
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: 20,
    justifyContent: 'space-evenly',
  },
  image: {
    width: '100%',
    height: '50%',
    borderRadius: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textDark,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 24,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#ccc',
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
