export const usePersonEdit = (personId: string) => {
  // API operations only
  const updatePerson = async (data: { name: string; age: number | null }) => {
    await $fetch(`/api/persons/${personId}`, {
      method: "PUT",
      body: {
        name: data.name.trim(),
        age: data.age,
      },
    });
  };

  return {
    // API operations
    updatePerson,
  };
};
