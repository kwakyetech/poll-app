import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  increment,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id?: string;
  title: string;
  description: string;
  pollType: 'single' | 'multiple' | 'text';
  options: PollOption[];
  expiresAt: string; // ISO string
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  createdBy: string;
  createdAt: any;
  isActive: boolean;
  votes?: Record<string, number>; // Map optionId to vote count
  totalVotes?: number;
}

export const createPoll = async (pollData: Omit<Poll, 'createdAt' | 'votes' | 'totalVotes' | 'isActive' | 'createdBy'>, userId: string) => {
  const pollsRef = collection(db, "polls");
  
  const votesMap: Record<string, number> = {};
  if (pollData.options && Array.isArray(pollData.options)) {
    pollData.options.forEach((opt) => {
      votesMap[opt.id] = 0;
    });
  }

  const newPoll = {
    ...pollData,
    createdBy: userId,
    createdAt: serverTimestamp(),
    votes: votesMap,
    totalVotes: 0,
    isActive: true
  };
  
  const docRef = await addDoc(pollsRef, newPoll);
  return docRef.id;
};

// ... (keep existing functions)

export const deletePoll = async (pollId: string) => {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "polls", pollId));
}

export const updatePollStatus = async (pollId: string, isActive: boolean) => {
    await updateDoc(doc(db, "polls", pollId), { isActive });
}


export const getPoll = async (id: string) => {
  const docRef = doc(db, "polls", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Convert Timestamp to Date/String if needed, but for now keep as is or handle in UI
    return { id: docSnap.id, ...data } as Poll;
  } else {
    return null;
  }
};

export const getPolls = async () => {
  const pollsRef = collection(db, "polls");
  const q = query(pollsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Poll[];
};

export const votePoll = async (pollId: string, userId: string, optionId: string) => {
  const pollRef = doc(db, "polls", pollId);
  const voteRef = collection(pollRef, "votes");
  
  // Check if user already voted for this option (or at all if single vote)
  // For multiple votes allowed, we might check if they already voted for THIS option.
  // For single vote, check if they voted at all.
  
  const pollSnap = await getDoc(pollRef);
  const pollData = pollSnap.data() as Poll;
  
  if (!pollData) throw new Error("Poll not found");

  const q = query(voteRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  if (!pollData.allowMultipleVotes && !querySnapshot.empty) {
     throw new Error("You have already voted on this poll.");
  }
  
  if (pollData.allowMultipleVotes) {
      // Check if already voted for this specific option
      const existingVote = querySnapshot.docs.find(doc => doc.data().optionId === optionId);
      if (existingVote) {
          throw new Error("You have already selected this option.");
      }
  }

  await addDoc(voteRef, {
    userId,
    optionId,
    votedAt: serverTimestamp()
  });
  
  await updateDoc(pollRef, {
    [`votes.${optionId}`]: increment(1),
    totalVotes: increment(1)
  });
};

export const submitTextResponse = async (pollId: string, userId: string, responseText: string) => {
    const pollRef = doc(db, "polls", pollId);
    const responsesRef = collection(pollRef, "responses");
    
    const q = query(responsesRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        throw new Error("You have already responded to this poll.");
    }

    await addDoc(responsesRef, {
        userId,
        responseText,
        createdAt: serverTimestamp()
    });
}

export const getTextResponses = async (pollId: string) => {
    const pollRef = doc(db, "polls", pollId);
    const responsesRef = collection(pollRef, "responses");
    const q = query(responsesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getUserVotes = async (pollId: string, userId: string) => {
    const pollRef = doc(db, "polls", pollId);
    const voteRef = collection(pollRef, "votes");
    const q = query(voteRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
}

export const getUserPolls = async (userId: string) => {
  const pollsRef = collection(db, "polls");
  const q = query(pollsRef, where("createdBy", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Poll[];
};


