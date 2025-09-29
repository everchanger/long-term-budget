import type { SelectPerson } from "~~/database/validation-schemas";

export const usePersonEdit = (
  personId: string,
  refreshPerson: () => Promise<void>
) => {
  // Modal state
  const isEditPersonModalOpen = ref(false);

  // Form state
  const editPersonFormState = reactive({
    name: "",
    age: null as number | null,
  });

  // Modal functions
  const openEditPersonModal = (person: SelectPerson | null) => {
    if (person) {
      editPersonFormState.name = person.name;
      editPersonFormState.age = person.age;
      isEditPersonModalOpen.value = true;
    }
  };

  const closeEditPersonModal = () => {
    isEditPersonModalOpen.value = false;
  };

  // CRUD operations
  const handleEditPersonSubmit = async () => {
    if (!editPersonFormState.name.trim()) return;

    try {
      await $fetch(`/api/persons/${personId}`, {
        method: "PUT",
        body: {
          name: editPersonFormState.name.trim(),
          age: editPersonFormState.age,
        },
      });

      // Refresh person data
      await refreshPerson();

      closeEditPersonModal();

      const toast = useToast();
      toast.add({
        title: "Person updated",
        description: `${editPersonFormState.name} has been updated successfully.`,
        color: "success",
      });
    } catch (error: unknown) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description:
          (error as { data?: { message?: string } }).data?.message ||
          "Failed to update person",
        color: "error",
      });
    }
  };

  return {
    // Modal state
    isEditPersonModalOpen,

    // Form state
    editPersonFormState,

    // Functions
    openEditPersonModal,
    closeEditPersonModal,
    handleEditPersonSubmit,
  };
};
